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
import type { EventMatch, MatchDate } from './generated/prisma/client';
import { createRetryMisskeyApiClientFetcher } from './misskey';
import { getTargetTime } from './util';

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
		if (res.length === 0) {
			break;
		}
		untilId = res.at(-1)?.id ?? null;
		const addend = res.filter((note) => note.text && targetPattern.test(note.text) && !note.user.isBot);
		notes = notes.concat(addend);
	}

	return notes;
}

type MatchRecordData = {
	uid: string;
	nid: string;
	postedAt: Date;
	dt: number;
	place: number;
};

async function postRankingNote(validRecords: MatchRecordData[], users: Record<string, string>, flyingCount: number) {
	if (env.DISABLE_POST_MATCH_RESULT) {
		return;
	}

	const validCount = validRecords.length;

	const host = env.WEB_HOST;
	const noteTitle = env.POST_MATCH_RESULT_TITLE;
	const noteUrl = env.POST_MATCH_RESULT_URL.replace('{host}', host);

	const ranking: string[] = [];
	const dts = [...new Set<number>(validRecords.map((r) => r.dt))];
	dts.sort((a, b) => a - b);
	for (let i = 0; i < dts.length; i++) {
		validRecords
			.filter((r) => r.dt === dts[i])
			.forEach((r) => {
				r.place = i + 1;
				if (i < 10) {
					let mention = '';
					if (users[r.uid]) {
						mention = `@${users[r.uid]}`;
					}
					ranking.push(`${placeEmojis[i + 1]} ${mention} +${(r.dt / 1000).toFixed(3)}s`);
				}
			});
	}
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

	for (const uid in users) {
		const username = users[uid];
		if (username !== undefined) {
			const user = await prisma.user.findUnique({ where: { id: uid } });
			if (user === null) {
				await prisma.user.create({
					data: {
						id: uid,
						userName: username,
					},
				});
				await prisma.userRankStatus.create({ data: { id: uid } });
				await prisma.userSettings.create({ data: { id: uid } });
			}
		}
	}

	for (const rec of [...validRecords, ...flyingRecords]) {
		await prisma.record.upsert({
			where: {
				noteId: rec.nid,
			},
			update: {
				postedAt: rec.postedAt,
				userId: rec.uid,
				place: rec.place,
				matchDateId: matchDate.id,
			},
			create: {
				noteId: rec.nid,
				postedAt: rec.postedAt,
				userId: rec.uid,
				place: rec.place,
				matchDateId: matchDate.id,
			},
		});
	}

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
	const withinTopUserRankStatuses = await prisma.userRankStatus.findMany({
		where: {
			OR: withinTopUids.map((rec) => ({ id: rec.uid })),
		},
	});
	const withinTopUserRankStatusesMap: Record<string, (typeof withinTopUserRankStatuses)[number]> = Object.fromEntries(
		withinTopUserRankStatuses.map((rec) => [rec.id, rec]),
	);
	const allTotalParticipationCounts = Object.fromEntries(
		(
			await prisma.record.groupBy({
				by: ['userId'],
				_count: {
					_all: true,
				},
			})
		).map((rec) => [rec.userId, rec._count._all]),
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
	for (const user of allUsers) {
		const uid = user.id;
		let userRankStatus = await prisma.userRankStatus.findUnique({ where: { id: uid } });
		if (userRankStatus === null) {
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
		await prisma.userRankHistory.create({
			data: {
				userId: uid,
				pt: result.nextTotalPoints,
				earnedPt: result.pointDelta,
				matchId: matchDate.id,
			},
		});
		await prisma.userRankStatus.update({
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
}

export async function processCronMain() {
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

	// 結果をノートする
	await postRankingNote(validRecords, users, flyingCount);

	// DBデータ全般更新
	const processedData = await upsertMatchResultData(validRecords, flyingRecords, users);
	records = processedData.records;
	const { eventMatch, matchDate } = processedData;

	// ランク計算
	await upsertRankResultData(records, validRecords, eventMatch, matchDate);
}

export async function processCronRemind() {
	const targetTimeDate = new Date();
	targetTimeDate.setUTCHours(env.TARGET_MATCH_HOUR);
	targetTimeDate.setUTCMinutes(env.TARGET_MATCH_MINUTES);
	targetTimeDate.setUTCSeconds(0);
	if (targetTimeDate < new Date()) {
		targetTimeDate.setDate(targetTimeDate.getDate() + 1);
	}

	const targetTime = targetTimeDate.getTime();

	const sinceTime = targetTime - 60 * 1000;
	const untilTime = targetTime + 60 * 1000;

	const sinceDate = new Date(sinceTime).toLocaleDateString('ja-JP');
	const untilDate = new Date(untilTime).toLocaleDateString('ja-JP');

	let crossOverDaysText = '';
	if (sinceDate !== untilDate) {
		crossOverDaysText = `(${sinceDate} -> ${untilDate})`;
	}

	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/create', { text: `${env.POST_MATCH_REMIND_TEXT}${crossOverDaysText}` });
}
