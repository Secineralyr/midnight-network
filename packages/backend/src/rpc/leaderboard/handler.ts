import { RankType } from '@midnight-network/shared/rank';
import type {
	AvgTimeParamsT,
	AvgTimeResponseT,
	MatchTimeParamsT,
	MatchTimeResponseT,
	RankHistParamsT,
	RankHistResponseT,
	RankParamsT,
	RankResponseT,
	WrParamsT,
	WrResponseT,
} from '@midnight-network/shared/rpc/leaderboard/models';
import { prisma } from '../../db';
import { withCache } from '../helpers/cache';
import { calculatePagination, getPreviousPlaceMap } from '../helpers/leaderboard';
import { getLatestMatchDate } from '../helpers/match';
import { calculateRankFromPoints, rankNumberToRankTypeValue } from '../helpers/rank';
import { makeCurrentRank, makeStatistics, statisticsSelector } from '../helpers/stats';

/**
 * 平均タイムのランキングを取得する。
 * フライングは平均に含めない。非フライング記録が0のユーザーは除外。
 * showLeaderboardRankingがfalseのユーザーは除外。
 * @param offset オフセット（1始まり）
 * @returns 平均タイムランキング
 */
export async function averageTime(offset: AvgTimeParamsT): Promise<AvgTimeResponseT> {
	console.info('rpc.leaderboard.averageTime', offset);
	return await withCache('averageTime', offset, async () => {
		const latestMatch = await getLatestMatchDate();
		console.info('rpc.leaderboard.averageTime.latestMatch', Boolean(latestMatch));

		const selectTotalCount = await prisma.user.count({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
				deltaTimeMsAvgPlace: {
					isNot: null,
				},
			},
		});
		console.info('rpc.leaderboard.averageTime.users', selectTotalCount);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(selectTotalCount, offset);
		console.info('rpc.leaderboard.averageTime.pagination', { currentOffset, maxOffset, skip, take });

		const users = (await prisma.user.findMany({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
				deltaTimeMsAvgPlace: {
					isNot: null,
				},
			},
			select: {
				...statisticsSelector,
				userName: true,
				deltaTimeMsAvg: undefined,
				deltaTimeMsAvgYesterday: true,
				deltaTimeMsAvgPlace: true,
			},
			skip,
			take,
			orderBy: {
				deltaTimeMsAvgPlace: {
					dtAvg: 'asc',
				},
			},
		})).map((v) => ({
			...v,
			deltaTimeMsAvg: v.deltaTimeMsAvgPlace,
		}));

		const previousPlaceMap = latestMatch ? await getPreviousPlaceMap(latestMatch.id) : new Map<string, number>();
		console.info('rpc.leaderboard.averageTime.previousPlaceMap', previousPlaceMap.size);

		const data = users.map((user) => {
			const stats = makeStatistics(user);
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const rank = makeCurrentRank(totalPt, stats?.totalParticipationCount ?? 0);

			return {
				place: user.deltaTimeMsAvgPlace?.place ?? 0,
				previousPlace: user.deltaTimeMsAvgYesterday?.place ?? 0,
				user: {
					userId: user.id,
					username: user.userName,
				},
				wr: stats?.wr ?? 0,
				averageTime: stats?.averageTime ?? 0,
				totalPt,
				rank: rank.rank,
			};
		});
		console.info('rpc.leaderboard.averageTime.data', data.length);

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined, // TODO: maybeAuthed
			data,
		};
	});
}

/**
 * 試合のタイムのランキングを取得する。
 * 本日の試合のタイムをランキング。フライングは除外。
 * showLeaderboardRankingがfalseのユーザーは除外。
 * @param offset オフセット（1始まり）
 * @returns 試合タイムランキング
 */
export async function matchTime(offset: MatchTimeParamsT): Promise<MatchTimeResponseT> {
	console.info('rpc.leaderboard.matchTime', offset);
	return await withCache('matchTime', offset, async () => {
		const latestMatch = await getLatestMatchDate();
		if (!latestMatch) {
			console.info('rpc.leaderboard.matchTime.noLatestMatch');
			return {
				currentOffset: 1,
				maxOffset: 0,
				yourRanking: undefined,
				data: [],
			};
		}

		const recordCount = await prisma.record.count({
			where: {
				matchDateId: latestMatch.id,
				place: {
					gt: 0,
				},
				user: {
					banned: false,
					userSettings: {
						OR: [{ showLeaderboardRanking: true }, { id: undefined }],
					},
				},
			},
		});

		const { currentOffset, maxOffset, skip, take } = calculatePagination(recordCount, offset);
		console.info('rpc.leaderboard.matchTime.pagination', { currentOffset, maxOffset, skip, take });

		const records = await prisma.record.findMany({
			where: {
				matchDateId: latestMatch.id,
				place: {
					gt: 0,
				},
				user: {
					banned: false,
					userSettings: {
						OR: [{ showLeaderboardRanking: true }, { id: undefined }],
					},
				},
			},
			select: {
				place: true,
				user: {
					select: {
						id: true,
						userName: true,
						userRankStatuses: {
							select: { pt: true },
						},
						winRate: {
							select: { wr: true },
						},
						deltaTimeMsAvg: {
							select: { dtAvg: true },
						},
						userParticipantsCount: {
							select: { participantsCount: true },
						},
					},
				},
			},
			skip,
			take,
			orderBy: {
				place: 'asc',
			},
		});
		console.info('rpc.leaderboard.matchTime.records', records.length);

		const data = records.map((record) => {
			const totalPt = record.user.userRankStatuses?.pt ?? 0;
			const { rankNumber, isNoRank } = calculateRankFromPoints(
				totalPt,
				record.user.userParticipantsCount?.participantsCount ?? 0,
			);
			const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

			return {
				place: record.place,
				user: {
					userId: record.user.id,
					username: record.user.userName,
				},
				wr: record.user.winRate?.wr ?? 0,
				averageTime: record.user.deltaTimeMsAvg?.dtAvg ?? 0,
				totalPt,
				rank: rankValue,
			};
		});

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined, // TODO: maybeAuthed
			data,
		};
	});
}

/**
 * ランクptのランキングを取得する。
 * showLeaderboardRankがfalseのユーザーは除外。
 * @param offset オフセット（1始まり）
 * @returns ランクptランキング
 */
export async function rank(offset: RankParamsT): Promise<RankResponseT> {
	console.info('rpc.leaderboard.rank', offset);
	return await withCache('rank', offset, async () => {
		const latestMatch = await getLatestMatchDate();
		console.info('rpc.leaderboard.rank.latestMatch', Boolean(latestMatch));

		const selectTotalCount = await prisma.user.count({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
				userRankStatuses: {
					isNot: null,
				},
			},
		});
		console.info('rpc.leaderboard.rank.users', selectTotalCount);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(selectTotalCount, offset);
		console.info('rpc.leaderboard.rank.pagination', { currentOffset, maxOffset, skip, take });

		const users = await prisma.user.findMany({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
				userRankStatuses: {
					isNot: null,
				},
			},
			select: {
				...statisticsSelector,
				userName: true,
				userRankYesterday: true,
			},
			skip,
			take,
			orderBy: {
				userRankStatuses: {
					pt: 'desc',
				},
			},
		});

		const previousPlaceMap = latestMatch ? await getPreviousPlaceMap(latestMatch.id) : new Map<string, number>();
		console.info('rpc.leaderboard.rank.previousPlaceMap', previousPlaceMap.size);

		const data = users.map((user, index) => {
			const stats = makeStatistics(user);
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const rank = makeCurrentRank(totalPt, stats?.totalParticipationCount ?? 0);

			return {
				place: skip + index + 1,
				previousPlace: user.userRankYesterday?.place ?? 0,
				user: {
					userId: user.id,
					username: user.userName,
				},
				wr: stats?.wr ?? 0,
				averageTime: stats?.averageTime ?? 0,
				totalPt,
				rank: rank.rank,
			};
		});
		console.info('rpc.leaderboard.rank.data', data.length);

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined, // TODO: maybeAuthed
			data,
		};
	});
}

/**
 * 各ランクにおいて全体がどれだけいるかをパーセントで返す。
 * NoRankは含めない。全ユーザーが対象。
 * @param _input 未使用
 * @returns ランク分布
 */
export async function rankHistogram(_input: RankHistParamsT): Promise<RankHistResponseT> {
	console.info('rpc.leaderboard.rankHistogram');
	return await withCache('rankHistogram', null, async () => {
		const users = await prisma.user.findMany({
			where: {
				banned: false,
			},
			select: {
				userRankStatuses: {
					select: { pt: true },
				},
				userParticipantsCount: {
					select: { participantsCount: true },
				},
			},
		});
		console.info('rpc.leaderboard.rankHistogram.users', users.length);

		const rankCounts: Record<number, number> = {};
		let totalRankedUsers = 0;

		for (const user of users) {
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const participationCount = user.userParticipantsCount?.participantsCount ?? 0;
			const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);

			if (isNoRank) {
				continue;
			}

			const rankValue = rankNumberToRankTypeValue(rankNumber, false);
			rankCounts[rankValue] = (rankCounts[rankValue] ?? 0) + 1;
			totalRankedUsers++;
		}

		if (totalRankedUsers === 0) {
			console.info('rpc.leaderboard.rankHistogram.noRankedUsers');
			return [];
		}
		console.info('rpc.leaderboard.rankHistogram.totalRankedUsers', totalRankedUsers);

		const result: RankHistResponseT = [];
		const rankValues = Object.values(RankType).filter((v) => v !== RankType.NoRank);

		for (const rankValue of rankValues) {
			const count = rankCounts[rankValue] ?? 0;
			const percent = (count / totalRankedUsers) * 100;
			result.push({
				rank: rankValue,
				percent,
			});
		}

		return result;
	});
}

/**
 * WR(優勝レート)のランキングを取得する。
 * WR = 1位回数 / 総参加回数（フライング含み、不参加は含まない）
 * フライングは1位回数にカウントしない。
 * 参加0回ユーザーは除外。
 * showLeaderboardRankingがfalseのユーザーは除外。
 * @param offset オフセット（1始まり）
 * @returns WRランキング
 */
export async function wr(offset: WrParamsT): Promise<WrResponseT> {
	console.info('rpc.leaderboard.wr', offset);
	return await withCache('wr', offset, async () => {
		const latestMatch = await getLatestMatchDate();
		console.info('rpc.leaderboard.wr.latestMatch', Boolean(latestMatch));

		const selectTotalCount = await prisma.user.count({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
				winRatePlace: {
					isNot: null,
				},
			},
		});
		console.info('rpc.leaderboard.wr.users', selectTotalCount);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(selectTotalCount, offset);
		console.info('rpc.leaderboard.wr.pagination', { currentOffset, maxOffset, skip, take });

		const users = (await prisma.user.findMany({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
				winRatePlace: {
					isNot: null,
				},
			},
			select: {
				...statisticsSelector,
				userName: true,
				winRate: undefined,
				winRatePlace: true,
				winRateYesterday: true,
			},
			skip,
			take,
			orderBy: {
				winRatePlace: {
					wr: 'desc',
				},
			},
		})).map((v) => ({
			...v,
			winRate: v.winRatePlace,
		}));

		const previousPlaceMap = latestMatch ? await getPreviousPlaceMap(latestMatch.id) : new Map<string, number>();
		console.info('rpc.leaderboard.wr.previousPlaceMap', previousPlaceMap.size);

		const data = users.map((user) => {
			const stats = makeStatistics(user);
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const rank = makeCurrentRank(totalPt, stats?.totalParticipationCount ?? 0);

			return {
				place: user.winRatePlace?.place ?? 0,
				previousPlace: user.winRateYesterday?.place ?? 0,
				user: {
					userId: user.id,
					username: user.userName,
				},
				wr: stats?.wr ?? 0,
				averageTime: stats?.averageTime ?? 0,
				totalPt,
				rank: rank.rank,
			};
		});
		console.info('rpc.leaderboard.wr.data', data.length);

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined, // TODO: maybeAuthed
			data,
		};
	});
}
