// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';
import { calculateRankUpdate } from '@midnight-network/rank-calc';
import type {
	BorderProtectionState,
	RankCalculationAbsentEvent,
	RankCalculationEvent,
	RankCalculationFlyingEvent,
	RankCalculationParticipatedEvent,
	RankProgressState,
	RankStreakState,
	WithinZoneRankSnapshot,
} from '@midnight-network/shared/rank-status-system';
import type { Note } from 'misskey-js/entities.js';
import { calculateRankStatusFromTotalPoints } from '../../rank-calc/src/rank-number';
import { placeEmojis } from './consts';
import { prisma } from './db';
import { upsertMany } from './db/upsert-many';
import type { EventMatch, MatchDate } from './generated/prisma/client';
import type {
	UserCreateManyInput,
	UserRankHistoryCreateManyInput,
	UserRankStatusCreateManyInput,
	UserRankStatusUpdateArgs,
	UserSettingsCreateManyInput,
} from './generated/prisma/models';
import { createRetryMisskeyApiClientFetcher } from './misskey';
import { readUserRankStatusSnapshot, writeUserRankStatusSnapshot } from './rank-status-snapshot';
import { parsePushSubscriptions } from './rpc/helpers/push';
import { calculateRankFromPoints, rankNumberToRankTypeValue } from './rpc/helpers/rank';
import { getTargetTime, wait } from './util';
import { sendPushNotification } from './web-push';

function getTargetTimeRange(): [number, number] {
	const targetTime = getTargetTime();
	const untilTime = targetTime + 60 * 1000;
	const sinceTime = targetTime - 60 * 1000;

	return [sinceTime, untilTime];
}

function getMatchRegex() {
	const untilTime = getTargetTimeRange()[1];
	const timeJst = new Date(untilTime + 9 * 3600 * 1000);
	const monthJst = timeJst.getUTCMonth();
	const dayJst = timeJst.getDay();

	return new RegExp(`${monthJst}/${dayJst}|${monthJst}月${dayJst}日|${env.GAME_JOIN_POST_TEXT_REGEX}`);
}

async function getNotes() {
	const [sinceTime, untilTime] = getTargetTimeRange();

	let notes: Note[] = [];
	const targetPattern = getMatchRegex();

	const mkApi = createRetryMisskeyApiClientFetcher();
	let untilId: string | null = null;
	console.info('cron.mainProcess: start get notes');
	while (true) {
		let paramUntil: Record<string, string | number>;
		if (untilId === null) {
			paramUntil = { untilDate: untilTime };
		} else {
			paramUntil = { untilId: untilId };
		}
		const params = {
			sinceDate: sinceTime,
			includeLocalRenotes: false,
			includeMyRenotes: false,
			includeRenotedMyNotes: false,
			limit: 100,
			withRenotes: false,
			...paramUntil,
		};
		const res = await mkApi('notes/hybrid-timeline', params);
		console.info(`cron.mainProcess: get length ${res.length}`);
		if (res.length === 0) {
			break;
		}
		untilId = res.at(-1)?.id ?? null;
		const addend = res.filter((note) => note.text && targetPattern.test(note.text) && !note.user.isBot);
		notes = notes.concat(addend);

		await wait(1000);
	}

	console.info(`cron.mainProcess: total note length ${notes.length}`);
	return notes;
}

type MatchRecordData = {
	uid: string;
	nid: string;
	postedAt: Date;
	dt: number;
	place: number;
};

async function writeMatchResultStatusSnapshot(matchDate: MatchDate): Promise<void> {
	console.info('cron.mainProcess: write status snapshot before rank update');
	const status = await prisma.userRankStatus.findMany();
	await writeUserRankStatusSnapshot(
		matchDate.id,
		Date.now(),
		status.map((s) => ({
			id: s.id,
			pt: s.pt,
			streakParticipationAt: s.streakParticipationAt,
			streakAbsenceAt: s.streakAbsenceAt,
			streakWithinTopAt: s.streakWithinTopAt,
			streakFlyingAt: s.streakFlyingAt,
			protectCoolTime: s.protectCoolTime,
		})),
	);
}

function calculatePlaces(validRecords: MatchRecordData[]) {
	const dts = [...new Set<number>(validRecords.map((r) => r.dt))];
	dts.sort((a, b) => a - b);
	for (let i = 0; i < dts.length; i++) {
		validRecords
			.filter((r) => r.dt === dts[i])
			.forEach((r) => {
				r.place = i + 1;
			});
	}
}

async function postRankingNote(validRecords: MatchRecordData[], users: Record<string, string>, flyingCount: number) {
	if (env.DISABLE_POST_MATCH_RESULT) {
		return;
	}

	const validCount = validRecords.length;

	const host = env.WEB_HOST;
	const noteTitle = env.POST_MATCH_RESULT_TITLE;
	const noteUrl = env.POST_MATCH_RESULT_URL.replace('{host}', host);

	const ranking: string[] = [];
	validRecords
		.filter((r) => r.place <= 10)
		.sort((a, b) => a.place - b.place || a.dt - b.dt)
		.forEach((r) => {
			let mention = '';
			if (users[r.uid]) {
				mention = `@${users[r.uid]}`;
			}
			ranking.push(`${placeEmojis[r.place]} ${mention} +${(r.dt / 1000).toFixed(3)}s`);
		});
	const rankText = ranking.join('\n');

	const resultText = env.POST_MATCH_RESULT_TEMPLATE.replace('{title}', noteTitle)
		.replace('{ranks}', rankText)
		.replace('{valid}', validCount.toFixed(0))
		.replace('{flying}', flyingCount.toFixed(0))
		.replace('{url}', noteUrl);

	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/create', { text: resultText });
}

async function upsertMatchResultData(
	validRecords: MatchRecordData[],
	flyingRecords: MatchRecordData[],
	users: Record<string, string>,
): Promise<{
	records: Record<string, MatchRecordData>;
	eventMatch: EventMatch | null;
	matchDate: MatchDate;
}> {
	const targetTimeDate = new Date(getTargetTime());

	const eventMatch = await prisma.eventMatch.findFirst({
		where: {
			AND: {
				startDate: {
					lte: targetTimeDate,
				},
				endDate: {
					gte: targetTimeDate,
				},
			},
		},
	});
	let eventData: { eventId?: number } = {};
	if (eventMatch !== null) {
		eventData = { eventId: eventMatch.id };
	}

	console.info('cron.mainProcess: insert matchDate');
	const matchDate = await prisma.matchDate.upsert({
		where: {
			date: targetTimeDate,
		},
		update: {
			date: targetTimeDate,
			...eventData,
		},
		create: {
			date: targetTimeDate,
			...eventData,
		},
	});

	const existsUsers = await prisma.user.findMany({ where: { id: { in: Object.keys(users) } }, select: { id: true } });
	const mustCreateUsers: UserCreateManyInput[] = [];
	const mustCreateStatus: UserRankStatusCreateManyInput[] = [];
	const mustCreateSettings: UserSettingsCreateManyInput[] = [];
	for (const uid in users) {
		const username = users[uid];
		if (username !== undefined) {
			if (existsUsers.findIndex(({ id }) => uid === id) >= 0) {
				continue;
			}
			mustCreateUsers.push({
				id: uid,
				userName: username,
			});
			mustCreateStatus.push({ id: uid });
			mustCreateSettings.push({ id: uid });
		}
	}

	console.info('cron.mainProcess: insert new user');
	if (mustCreateUsers.length > 0) {
		console.info(`cron.mainProcess: new user length ${mustCreateUsers.length}`);
		await prisma.user.createMany({ data: mustCreateUsers });
	}

	console.info('cron.mainProcess: insert new user status');
	if (mustCreateStatus.length > 0) {
		console.info(`cron.mainProcess: new user status length ${mustCreateUsers.length}`);
		await prisma.userRankStatus.createMany({ data: mustCreateStatus });
	}

	console.info('cron.mainProcess: insert new user settings');
	if (mustCreateSettings.length > 0) {
		console.info(`cron.mainProcess: new user settings length ${mustCreateUsers.length}`);
		await prisma.userSettings.createMany({ data: mustCreateSettings });
	}

	console.info('cron.mainProcess: insert record');
	const allRecords = [...validRecords, ...flyingRecords];
	if (allRecords.length > 0) {
		await upsertMany(prisma, 'Record', prisma.record, {
			autoTimestamps: true,
			conflictKeys: ['noteId'],
			updateKeys: ['postedAt', 'userId', 'place', 'matchDateId'],
			data: allRecords.map((rec) => ({
				noteId: rec.nid,
				postedAt: rec.postedAt,
				userId: rec.uid,
				place: rec.place,
				matchDateId: matchDate.id,
			})),
		});
	}

	console.info('cron.mainProcess: record process ok');
	return {
		records: Object.fromEntries([...validRecords, ...flyingRecords].map((rec) => [rec.uid, rec])),
		eventMatch,
		matchDate,
	};
}

async function upsertRankResultData(
	records: Record<string, MatchRecordData>,
	validRecords: MatchRecordData[],
	eventMatch: EventMatch | null,
	matchDate: MatchDate,
) {
	const validCount = validRecords.length;

	const allUsers = await prisma.user.findMany();
	const withinTopUids = validRecords.filter((rec) => rec.place <= 10);
	const withinTopUserRankStatuses =
		withinTopUids.length > 0
			? await prisma.userRankStatus.findMany({
					where: {
						OR: withinTopUids.map((rec) => ({ id: rec.uid })),
					},
				})
			: [];
	const withinTopUserRankStatusesMap: Record<string, (typeof withinTopUserRankStatuses)[number]> = Object.fromEntries(
		withinTopUserRankStatuses.map((rec) => [rec.id, rec]),
	);
	const allTotalParticipationCounts = Object.fromEntries(
		(await prisma.userParticipantsCount.findMany()).map((rec) => [rec.userId, rec.participantsCount]),
	);
	const withinZoneParticipants: WithinZoneRankSnapshot[] = validRecords
		.filter((rec) => rec.place <= 10)
		.map((rec) => ({
			placement: rec.place,
			rankNumber: calculateRankStatusFromTotalPoints(
				withinTopUserRankStatusesMap[rec.uid]?.pt ?? 0,
				allTotalParticipationCounts[rec.uid] ?? 0,
			).rankNumber,
		}));

	const userRankStatuses = await prisma.userRankStatus.findMany();
	const createRankHistories: UserRankHistoryCreateManyInput[] = [];
	const updateRankStatusData: UserRankStatusUpdateArgs[] = [];
	for (const user of allUsers) {
		const uid = user.id;
		let userRankStatus = userRankStatuses.find((v) => v.id === uid);
		if (userRankStatus === undefined) {
			// 基本的に発生し得ないが、予防処理
			userRankStatus = await prisma.userRankStatus.create({ data: { id: uid } });
		}

		const totalParticipationCount = allTotalParticipationCounts[uid] ?? 0;
		const streak: RankStreakState = {
			consecutiveParticipationDays: userRankStatus.streakParticipationAt,
			consecutiveWithinZoneDays: userRankStatus.streakWithinTopAt,
			consecutiveAbsenceDays: userRankStatus.streakAbsenceAt,
			consecutiveFlyingCount: userRankStatus.streakFlyingAt,
		};
		const borderProtection: BorderProtectionState = {
			cooldownDays: userRankStatus.protectCoolTime,
		};

		const currentState: RankProgressState = {
			totalPoints: userRankStatus.pt,
			totalParticipationCount: totalParticipationCount,
			streak: streak,
			borderProtection: borderProtection,
		};

		let event: RankCalculationEvent;
		let eventMultiplier = 1.0;
		if (eventMatch !== null) {
			eventMultiplier = eventMatch.multiplePt;
		}

		if (records[uid]) {
			if (records[uid].dt >= 0) {
				event = {
					kind: 'participated',
					participantCount: validCount,
					placement: records[uid].place,
					timeSeconds: records[uid].dt,
					withinZoneParticipants: withinZoneParticipants,
					eventMultiplier: eventMultiplier,
				} satisfies RankCalculationParticipatedEvent;
			} else {
				event = {
					kind: 'flying',
					timeSeconds: records[uid].dt,
				} satisfies RankCalculationFlyingEvent;
			}
		} else {
			event = { kind: 'absent' } satisfies RankCalculationAbsentEvent;
		}

		const result = calculateRankUpdate(currentState, event);
		if (!(event.kind === 'absent' && result.pointDelta === 0)) {
			createRankHistories.push({
				userId: uid,
				pt: result.nextTotalPoints,
				earnedPt: result.pointDelta,
				matchId: matchDate.id,
			});
		}

		updateRankStatusData.push({
			where: { id: uid },
			data: {
				pt: result.nextTotalPoints,
				streakParticipationAt: result.nextStreak.consecutiveParticipationDays,
				streakAbsenceAt: result.nextStreak.consecutiveAbsenceDays,
				streakWithinTopAt: result.nextStreak.consecutiveWithinZoneDays,
				streakFlyingAt: result.nextStreak.consecutiveFlyingCount,
				protectCoolTime: result.nextBorderProtection.cooldownDays,
			},
		});
	}

	// 再集計時の重複を防ぐため、同じmatchIdの既存履歴を削除してから作成
	console.info('cron.mainProcess: delete histories');
	await prisma.userRankHistory.deleteMany({ where: { matchId: matchDate.id } });
	console.info('cron.mainProcess: create histories');
	if (createRankHistories.length > 0) {
		await prisma.userRankHistory.createMany({ data: createRankHistories });
	}
	console.info('cron.mainProcess: update rank status');
	await Promise.all(updateRankStatusData.map((v) => prisma.userRankStatus.update(v)));
}

/**
 * 参加ユーザーにPush通知を送信する。
 * 通知内容: 順位、タイム、獲得pt、反映後合計pt、ランクアップ有無、現在ランク
 */
async function sendMatchResultNotifications(records: Record<string, MatchRecordData>) {
	const userIds = Object.keys(records);
	if (userIds.length === 0) {
		return;
	}
	const [authUsers, rankStatuses, partCounts, latestMatch] = await Promise.all([
		prisma.authUser.findMany({
			where: { id: { in: userIds }, pushSubscriptions: { not: null } },
			select: { id: true, pushSubscriptions: true },
		}),
		prisma.userRankStatus.findMany({ where: { id: { in: userIds } } }),
		prisma.userParticipantsCount.findMany({ where: { userId: { in: userIds } } }),
		prisma.matchDate.findFirst({ orderBy: { date: 'desc' } }),
	]);

	const subsByUser = new Map(
		authUsers.map((au) => [au.id, parsePushSubscriptions(au.pushSubscriptions)] as const).filter(([, s]) => s.length > 0),
	);
	if (subsByUser.size === 0) {
		return;
	}

	const statusMap = Object.fromEntries(rankStatuses.map((s) => [s.id, s]));
	const partCountMap = Object.fromEntries(partCounts.map((r) => [r.userId, r.participantsCount]));

	const [histories, prevHistories] = latestMatch
		? await Promise.all([
				prisma.userRankHistory.findMany({ where: { userId: { in: userIds }, matchId: latestMatch.id } }),
				prisma.userRankHistory.findMany({
					where: { userId: { in: userIds }, matchId: { not: latestMatch.id } },
					orderBy: { matchId: 'desc' },
					distinct: ['userId'],
				}),
			])
		: [[], []];
	const historyMap = Object.fromEntries(histories.map((h) => [h.userId, h]));
	const prevMap = Object.fromEntries(prevHistories.map((h) => [h.userId, h]));

	const sendPromises: Promise<void>[] = [];
	for (const [userId, subs] of subsByUser) {
		const record = records[userId];
		if (!record) {
			continue;
		}

		const totalPt = statusMap[userId]?.pt ?? 0;
		const count = partCountMap[userId] ?? 0;
		const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, count);
		const prev = prevMap[userId];
		const rankUp = prev ? rankNumber > calculateRankFromPoints(prev.pt, Math.max(0, count - 1)).rankNumber : false;
		const timeSec = record.dt / 1000;

		const payload = JSON.stringify({
			type: 'match_result',
			place: record.place,
			time: record.dt >= 0 ? `+${timeSec.toFixed(3)}` : `${timeSec.toFixed(3)}`,
			earnedPt: historyMap[userId]?.earnedPt ?? 0,
			totalPt,
			rankUp,
			rank: rankNumberToRankTypeValue(rankNumber, isNoRank),
		});

		for (const sub of subs) {
			sendPromises.push(
				sendPushNotification(sub, payload).then(async (res) => {
					if (!res.gone) {
						return;
					}
					const au = await prisma.authUser.findUnique({ where: { id: userId }, select: { pushSubscriptions: true } });
					const filtered = parsePushSubscriptions(au?.pushSubscriptions).filter((s) => s.endpoint !== sub.endpoint);
					await prisma.authUser.update({
						where: { id: userId },
						data: { pushSubscriptions: filtered.length > 0 ? JSON.stringify(filtered) : null },
					});
				}),
			);
		}
	}

	const results = await Promise.allSettled(sendPromises);
	console.info(`cron.pushNotifications: sent ${results.filter((r) => r.status === 'fulfilled').length}/${results.length}`);
}

export async function processCronMain(options?: { isRerun?: boolean }) {
	console.info('start main process');
	const targetTime = getTargetTime();

	const notes = await getNotes();

	// データ整理
	const users: Record<string, string> = {};
	let records: Record<string, MatchRecordData> = {};
	for (const n of notes) {
		const uid = n.userId;
		const dt = Date.parse(n.createdAt) - targetTime;
		if (!records[uid] || records[uid].dt > dt) {
			records[uid] = {
				uid: uid,
				nid: n.id,
				postedAt: new Date(n.createdAt),
				dt: dt,
				place: -1,
			};
		}
		users[uid] = n.user.username;
	}

	const validRecords = [...Object.values(records)].filter((n) => n.dt >= 0);
	const flyingRecords = [...Object.values(records)].filter((n) => n.dt < 0);

	const validCount = validRecords.length;
	const flyingCount = [...Object.values(records)].length - validCount;

	// 順位計算
	calculatePlaces(validRecords);

	// 結果をノートする
	console.info('cron.mainProcess: post note ranking');
	await postRankingNote(validRecords, users, flyingCount);

	// DBデータ全般更新
	console.info('cron.mainProcess: create record to db');
	const processedData = await upsertMatchResultData(validRecords, flyingRecords, users);
	records = processedData.records;
	const { eventMatch, matchDate } = processedData;

	// MatchDateとRecordが挿入されてしまっているが、まだUserRankStatusは問題ないのでここでスナップショットを取る
	await writeMatchResultStatusSnapshot(matchDate);

	console.info('cron.mainProcess: start update rank');
	// ランク計算
	await upsertRankResultData(records, validRecords, eventMatch, matchDate);

	// Push通知送信（再実行時はスキップ）
	if (!options?.isRerun) {
		console.info('cron.mainProcess: send push notifications');
		await sendMatchResultNotifications(records);
	}
}

/**
 * rerun 用の事前復元を行ってから通常集計を実行する。
 */

export async function processCronMainRerun(runId?: number) {
	console.info('start main process for rerun');
	const latestMatchDate = await prisma.matchDate.findFirst({
		orderBy: { id: 'desc' },
	});

	const matchTargetTime = latestMatchDate?.date.getTime();
	const currenttargetTime = getTargetTime();

	if (latestMatchDate && matchTargetTime === currenttargetTime) {
		const snapshot = await readUserRankStatusSnapshot(latestMatchDate.id, runId);
		if (snapshot !== null) {
			console.info('cron.reRunProcess: delete UserRankHistory');
			await prisma.userRankHistory.deleteMany({ where: { matchId: latestMatchDate.id } });
			console.info('cron.reRunProcess: delete Records');
			await prisma.record.deleteMany({ where: { matchDateId: latestMatchDate.id } });
			console.info('cron.reRunProcess: delete MatchDate');
			await prisma.matchDate.deleteMany({ where: { id: latestMatchDate.id } });

			console.info('cron.reRunProcess: restore userRankStatus');
			await upsertMany(prisma, 'UserRankStatus', prisma.userRankStatus, {
				autoTimestamps: true,
				conflictKeys: ['id'],
				updateKeys: [
					'pt',
					'streakParticipationAt',
					'streakAbsenceAt',
					'streakWithinTopAt',
					'streakFlyingAt',
					'protectCoolTime',
				],
				data: snapshot.status,
			});
		} else {
			console.info('cron.reRunProcess: no snapshot for matchDate.');
		}
	} else {
		console.info('cron.reRunProcess: no matchDate data.');
	}

	await processCronMain({ isRerun: true });
}

export async function processCronRemind() {
	console.info('start remind');
	const [sinceTime, untilTime] = getTargetTimeRange();

	const sinceDate = new Date(sinceTime).toLocaleDateString('ja-JP');
	const untilDate = new Date(untilTime).toLocaleDateString('ja-JP');

	let crossOverDaysText = '';
	if (sinceDate !== untilDate) {
		crossOverDaysText = `(${sinceDate} -> ${untilDate})`;
	}

	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/create', { text: `${env.POST_MATCH_REMIND_TEXT}${crossOverDaysText}` });
	console.info('remind posted');
}
