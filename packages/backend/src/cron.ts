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
import { getTargetTime, wait } from './util';

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

type RerunBaseStatus = {
	pt: number;
	streakParticipationAt: number;
	streakAbsenceAt: number;
	streakWithinTopAt: number;
	streakFlyingAt: number;
	protectCoolTime: number;
};

/**
 * rerun 用に集計前の status をユーザーごとに構築する。
 */
async function buildRerunBaseStatusMap(matchDate: MatchDate): Promise<Record<string, RerunBaseStatus>> {
	const users = await prisma.user.findMany({ select: { id: true } });
	// そのuserの最後に変動した試合
	const latestHistoryKeys = await prisma.userRankHistory.groupBy({
		by: ['userId'],
		where: {
			matchDate: {
				date: {
					lt: matchDate.date,
				},
			},
		},
		_max: { matchId: true },
	});

	const historyPairs = latestHistoryKeys
		.map((record) => {
			const matchId = record._max.matchId;
			if (matchId === null) {
				return undefined;
			}
			return { userId: record.userId, matchId };
		})
		.filter((v): v is NonNullable<typeof v> => v !== undefined);

	const selectFields = {
		userId: true,
		pt: true,
		streakParticipationAt: true,
		streakAbsenceAt: true,
		streakWithinTopAt: true,
		streakFlyingAt: true,
		protectCoolTime: true,
		matchDate: {
			select: { date: true },
		},
	} as const;
	// 何故かいっぺんに取得できない
	const historiesTask = historyPairs.map((v) =>
		prisma.userRankHistory.findFirst({
			where: v,
			select: selectFields,
		}),
	);
	const histories = (await Promise.all(historiesTask)).flat().filter((v): v is NonNullable<typeof v> => v !== null);

	const latestHistoryMap = new Map<string, (typeof histories)[number]>();
	for (const history of histories) {
		if (!latestHistoryMap.has(history.userId)) {
			latestHistoryMap.set(history.userId, history);
		}
	}

	const uniqueLastDates = new Set<number>();
	for (const history of latestHistoryMap.values()) {
		uniqueLastDates.add(history.matchDate.date.getTime());
	}

	// ユーザーの持つ最新履歴の試合から何試合行われてきたか
	const gapEntries = await Promise.all(
		[...uniqueLastDates].map(async (lastDateTime) => {
			const gap = await prisma.matchDate.count({
				where: {
					date: {
						gt: new Date(lastDateTime),
						lt: matchDate.date,
					},
				},
			});
			return [lastDateTime, gap] as const;
		}),
	);
	const gapCountMap = new Map<number, number>(gapEntries);

	const baseStatusMap: Record<string, RerunBaseStatus> = {};
	for (const user of users) {
		const history = latestHistoryMap.get(user.id);
		// そもそも存在しないユーザーは参加していないので全て0であるはずである。
		if (!history) {
			baseStatusMap[user.id] = {
				pt: 0,
				streakParticipationAt: 0,
				streakAbsenceAt: 0,
				streakWithinTopAt: 0,
				streakFlyingAt: 0,
				protectCoolTime: 0,
			};
			continue;
		}

		const lastDateTime = history.matchDate.date.getTime();
		const gap = gapCountMap.get(lastDateTime) ?? 0;
		const hasGap = gap > 0;

		// 最後の変動からどれだけ経過したかをgapとし、
		// そのgapが0以上であれば変動してないかつ未参加である。
		// なので連続参加系の値は基本的に0となる
		baseStatusMap[user.id] = {
			pt: history.pt,
			streakParticipationAt: hasGap ? 0 : history.streakParticipationAt,
			streakAbsenceAt: history.streakAbsenceAt + gap,
			streakWithinTopAt: hasGap ? 0 : history.streakWithinTopAt,
			streakFlyingAt: hasGap ? 0 : history.streakFlyingAt,
			protectCoolTime: history.protectCoolTime,
		};
	}

	return baseStatusMap;
}

/**
 * baseStatusMap の内容で UserRankStatus を巻き戻す。
 */
async function resetRankStatusFromBaseStatusMap(baseStatusMap: Record<string, RerunBaseStatus>): Promise<void> {
	const userIds = Object.keys(baseStatusMap);
	if (userIds.length === 0) {
		return;
	}

	const resetStatusData = userIds
		.map((userId) => {
			const baseStatus = baseStatusMap[userId];
			if (!baseStatus) {
				return undefined;
			}
			return {
				id: userId,
				pt: baseStatus.pt,
				streakParticipationAt: baseStatus.streakParticipationAt,
				streakAbsenceAt: baseStatus.streakAbsenceAt,
				streakWithinTopAt: baseStatus.streakWithinTopAt,
				streakFlyingAt: baseStatus.streakFlyingAt,
				protectCoolTime: baseStatus.protectCoolTime,
			};
		})
		.filter((v): v is NonNullable<typeof v> => v !== undefined);

	if (resetStatusData.length === 0) {
		console.info('cron.mainProcess: no reset rank status');
		return;
	}

	console.info('cron.mainProcess: reset rank status for rerun');
	await upsertMany(prisma, 'UserRankStatus', prisma.userRankStatus, {
		conflictKeys: ['id'],
		updateKeys: [
			'pt',
			'streakParticipationAt',
			'streakAbsenceAt',
			'streakWithinTopAt',
			'streakFlyingAt',
			'protectCoolTime',
		],
		data: resetStatusData,
	});
}

/**
 * rerun 実行前の復元と削除をまとめて行う。
 */
async function prepareRerunState(): Promise<void> {
	const targetTimeDate = new Date(getTargetTime());

	console.info('cron.mainProcess: find latest matchDate (rerun)');
	const matchDate = await prisma.matchDate.findFirst({
		where: {
			date: targetTimeDate,
		},
	});

	if (matchDate === null) {
		console.info('cron.mainProcess: no matchDate data. exit rerun prepare');
		return;
	}

	const baseStatusMap = await buildRerunBaseStatusMap(matchDate);
	await resetRankStatusFromBaseStatusMap(baseStatusMap);

	console.info('cron.mainProcess: delete records for rerun');
	await prisma.record.deleteMany({ where: { matchDateId: matchDate.id } });
	console.info('cron.mainProcess: delete histories for rerun');
	await prisma.userRankHistory.deleteMany({ where: { matchId: matchDate.id } });
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
				streakParticipationAt: result.nextStreak.consecutiveParticipationDays,
				streakAbsenceAt: result.nextStreak.consecutiveAbsenceDays,
				streakWithinTopAt: result.nextStreak.consecutiveWithinZoneDays,
				streakFlyingAt: result.nextStreak.consecutiveFlyingCount,
				protectCoolTime: result.nextBorderProtection.cooldownDays,
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
	await updateRankStatusData.map((v) => prisma.userRankStatus.update(v));
}

export async function processCronMain() {
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

	console.info('cron.mainProcess: start update rank');
	// ランク計算
	await upsertRankResultData(records, validRecords, eventMatch, matchDate);
}

/**
 * rerun 用の事前復元を行ってから通常集計を実行する。
 */

export async function processCronMainRerun() {
	await prepareRerunState();
	await processCronMain();
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
