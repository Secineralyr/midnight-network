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
import { calculateTimeDifferenceSeconds, getLatestMatchDate, isFlying } from '../helpers/match';
import { calculateRankFromPoints, rankNumberToRankTypeValue } from '../helpers/rank';
import { calculateStatisticsFromRecords } from '../helpers/statistics';

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

		const users = await prisma.user.findMany({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
			},
			select: {
				id: true,
				userName: true,
				userRankStatuses: {
					select: { pt: true },
				},
				records: {
					select: {
						place: true,
						postedAt: true,
						matchDate: {
							select: { date: true },
						},
					},
				},
			},
		});
		console.info('rpc.leaderboard.averageTime.users', users.length);

		const userStats = users
			.map((user) => {
				const stats = calculateStatisticsFromRecords(user.records);
				const totalPt = user.userRankStatuses?.pt ?? 0;
				const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, stats.totalParticipationCount);

				return {
					userId: user.id,
					username: user.userName,
					totalPt,
					rankNumber,
					isNoRank,
					wr: stats.wr,
					averageTime: stats.averageTime,
				};
			})
			.filter((u) => u.averageTime !== undefined)
			.sort((a, b) => (a.averageTime as number) - (b.averageTime as number));
		console.info('rpc.leaderboard.averageTime.userStats', userStats.length);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(userStats.length, offset);
		console.info('rpc.leaderboard.averageTime.pagination', { currentOffset, maxOffset, skip, take });
		const pageData = userStats.slice(skip, skip + take);

		const previousPlaceMap = latestMatch ? await getPreviousPlaceMap(latestMatch.id) : new Map<string, number>();
		console.info('rpc.leaderboard.averageTime.previousPlaceMap', previousPlaceMap.size);

		const data = pageData.map((user, index) => {
			const rankValue = rankNumberToRankTypeValue(user.rankNumber, user.isNoRank);
			return {
				place: skip + index + 1,
				previousPlace: previousPlaceMap.get(user.userId) ?? 0,
				user: {
					userId: user.userId,
					username: user.username,
				},
				wr: user.wr,
				averageTime: user.averageTime as number,
				totalPt: user.totalPt,
				rank: rankValue,
			};
		});

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined,
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

		const records = await prisma.record.findMany({
			where: {
				matchDateId: latestMatch.id,
				user: {
					banned: false,
					userSettings: {
						OR: [{ showLeaderboardRanking: true }, { id: undefined }],
					},
				},
			},
			select: {
				place: true,
				postedAt: true,
				user: {
					select: {
						id: true,
						userName: true,
						userRankStatuses: {
							select: { pt: true },
						},
						records: {
							select: {
								place: true,
								postedAt: true,
								matchDate: {
									select: { date: true },
								},
							},
						},
					},
				},
				matchDate: {
					select: { date: true },
				},
			},
		});
		console.info('rpc.leaderboard.matchTime.records', records.length);

		const validRecords = records
			.filter((record) => {
				const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);
				return !isFlying(timeDiff);
			})
			.sort((a, b) => {
				const timeA = calculateTimeDifferenceSeconds(a.postedAt, a.matchDate.date);
				const timeB = calculateTimeDifferenceSeconds(b.postedAt, b.matchDate.date);
				return timeA - timeB;
			});
		console.info('rpc.leaderboard.matchTime.validRecords', validRecords.length);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(validRecords.length, offset);
		console.info('rpc.leaderboard.matchTime.pagination', { currentOffset, maxOffset, skip, take });
		const pageData = validRecords.slice(skip, skip + take);

		const data = pageData.map((record, index) => {
			const totalPt = record.user.userRankStatuses?.pt ?? 0;
			const stats = calculateStatisticsFromRecords(record.user.records);
			const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, stats.totalParticipationCount);
			const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

			return {
				place: skip + index + 1,
				user: {
					userId: record.user.id,
					username: record.user.userName,
				},
				wr: stats.wr,
				averageTime: stats.averageTime ?? 0,
				totalPt,
				rank: rankValue,
			};
		});

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined,
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

		const users = await prisma.user.findMany({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRank: true }, { id: undefined }],
				},
			},
			select: {
				id: true,
				userName: true,
				userRankStatuses: {
					select: { pt: true },
				},
				records: {
					select: {
						place: true,
						postedAt: true,
						matchDate: {
							select: { date: true },
						},
					},
				},
			},
			orderBy: {
				userRankStatuses: {
					pt: 'desc',
				},
			},
		});
		console.info('rpc.leaderboard.rank.users', users.length);

		const sortedUsers = users.filter((u) => u.userRankStatuses !== null);
		console.info('rpc.leaderboard.rank.sortedUsers', sortedUsers.length);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(sortedUsers.length, offset);
		console.info('rpc.leaderboard.rank.pagination', { currentOffset, maxOffset, skip, take });
		const pageData = sortedUsers.slice(skip, skip + take);

		const previousPlaceMap = latestMatch ? await getPreviousPlaceMap(latestMatch.id) : new Map<string, number>();
		console.info('rpc.leaderboard.rank.previousPlaceMap', previousPlaceMap.size);

		const data = pageData.map((user, index) => {
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const stats = calculateStatisticsFromRecords(user.records);
			const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, stats.totalParticipationCount);
			const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

			return {
				place: skip + index + 1,
				previousPlace: previousPlaceMap.get(user.id) ?? 0,
				user: {
					userId: user.id,
					username: user.userName,
				},
				wr: stats.wr,
				averageTime: stats.averageTime ?? 0,
				totalPt,
				rank: rankValue,
			};
		});

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined,
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
				records: {
					select: { id: true },
				},
			},
		});
		console.info('rpc.leaderboard.rankHistogram.users', users.length);

		const rankCounts: Record<number, number> = {};
		let totalRankedUsers = 0;

		for (const user of users) {
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const participationCount = user.records.length;
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

		const users = await prisma.user.findMany({
			where: {
				banned: false,
				userSettings: {
					OR: [{ showLeaderboardRanking: true }, { id: undefined }],
				},
			},
			select: {
				id: true,
				userName: true,
				userRankStatuses: {
					select: { pt: true },
				},
				records: {
					select: {
						place: true,
						postedAt: true,
						matchDate: {
							select: { date: true },
						},
					},
				},
			},
		});
		console.info('rpc.leaderboard.wr.users', users.length);

		const userStats = users
			.map((user) => {
				const stats = calculateStatisticsFromRecords(user.records);
				const totalPt = user.userRankStatuses?.pt ?? 0;
				const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, stats.totalParticipationCount);

				return {
					userId: user.id,
					username: user.userName,
					totalPt,
					rankNumber,
					isNoRank,
					wr: stats.wr,
					averageTime: stats.averageTime ?? 0,
					totalParticipationCount: stats.totalParticipationCount,
				};
			})
			.filter((u) => u.totalParticipationCount > 0)
			.sort((a, b) => b.wr - a.wr);
		console.info('rpc.leaderboard.wr.userStats', userStats.length);

		const { currentOffset, maxOffset, skip, take } = calculatePagination(userStats.length, offset);
		console.info('rpc.leaderboard.wr.pagination', { currentOffset, maxOffset, skip, take });
		const pageData = userStats.slice(skip, skip + take);

		const previousPlaceMap = latestMatch ? await getPreviousPlaceMap(latestMatch.id) : new Map<string, number>();
		console.info('rpc.leaderboard.wr.previousPlaceMap', previousPlaceMap.size);

		const data = pageData.map((user, index) => {
			const rankValue = rankNumberToRankTypeValue(user.rankNumber, user.isNoRank);
			return {
				place: skip + index + 1,
				previousPlace: previousPlaceMap.get(user.userId) ?? 0,
				user: {
					userId: user.userId,
					username: user.username,
				},
				wr: user.wr,
				averageTime: user.averageTime,
				totalPt: user.totalPt,
				rank: rankValue,
			};
		});

		return {
			currentOffset,
			maxOffset,
			yourRanking: undefined,
			data,
		};
	});
}
