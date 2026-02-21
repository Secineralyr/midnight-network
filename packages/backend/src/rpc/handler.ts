// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type {
	RankTopParamsT,
	RankTopResponseT,
	SearchUserParamsT,
	SearchUserResponseT,
	TodayTopParamsT,
	TodayTopResponseT,
} from '@midnight-network/shared/rpc/models';
import { prisma } from '../db';
import { withCache } from './helpers/cache';
import { calculateTimeDifferenceSeconds, getLatestMatchDate, isFlying } from './helpers/match';
import { calculateRankFromPoints, rankNumberToRankTypeValue } from './helpers/rank';

/**
 * ユーザー名を検索する。
 * クエリを含むユーザー名を持つユーザーを返す。
 * showProfileSearchがfalseのユーザーは除外される。
 * @param query 検索クエリ
 * @returns マッチしたユーザー一覧
 */
export async function searchUser(query: SearchUserParamsT): Promise<SearchUserResponseT> {
	console.info('rpc.searchUser', query);
	return await withCache('searchUser', query, async () => {
		const users = await prisma.user.findMany({
			where: {
				banned: false,
				userName: {
					contains: query,
				},
				userSettings: {
					OR: [{ showProfileSearch: true }, { id: undefined }],
				},
			},
			select: {
				id: true,
				userName: true,
			},
			take: 20,
		});
		console.info('rpc.searchUser.users', users.length);

		return users.map((user) => ({
			userId: user.id,
			username: user.userName,
		}));
	});
}

/**
 * 本日の試合におけるトップ3ユーザーの結果を返す。
 * showLeaderboardRankingがfalseのユーザーは除外される。
 * フライングは除外される。
 * @param _input 未使用
 * @returns 本日のトップ3
 */
export async function todayTop(_input: TodayTopParamsT): Promise<TodayTopResponseT> {
	console.info('rpc.todayTop');
	return await withCache('todayTop', null, async () => {
		const latestMatch = await getLatestMatchDate();
		if (!latestMatch) {
			console.info('rpc.todayTop.noLatestMatch');
			return [];
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
							},
						},
					},
				},
				matchDate: {
					select: { date: true },
				},
			},
			orderBy: {
				place: 'asc',
			},
		});
		console.info('rpc.todayTop.records', records.length);

		const validRecords = records.filter((record) => {
			const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);
			return !isFlying(timeDiff);
		});
		console.info('rpc.todayTop.validRecords', validRecords.length);

		const top3 = validRecords.slice(0, 3);
		console.info('rpc.todayTop.top3', top3.length);

		return top3.map((record) => {
			const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);
			const totalPt = record.user.userRankStatuses?.pt ?? 0;
			const participationCount = record.user.records.length;
			const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);
			const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

			return {
				place: record.place,
				rank: rankValue,
				user: {
					userId: record.user.id,
					username: record.user.userName,
				},
				time: timeDiff,
			};
		});
	});
}

/**
 * ランクトップ3ユーザーの結果を返す。
 * showLeaderboardRankがfalseのユーザーは除外される。
 * @param _input 未使用
 * @returns ランクトップ3
 */
export async function rankTop(_input: RankTopParamsT): Promise<RankTopResponseT> {
	console.info('rpc.rankTop');
	return await withCache('rankTop', null, async () => {
		const users = await prisma.user.findMany({
			where: {
				banned: false,
				userRankStatuses: {
					isNot: null,
				},
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
					select: { id: true },
				},
			},
			orderBy: {
				userRankStatuses: {
					pt: 'desc',
				},
			},
			take: 3,
		});
		console.info('rpc.rankTop.users', users.length);

		return users.map((user, index) => {
			const totalPt = user.userRankStatuses?.pt ?? 0;
			const participationCount = user.records.length;
			const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);
			const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

			return {
				place: index + 1,
				rank: rankValue,
				user: {
					userId: user.id,
					username: user.userName,
				},
				pt: totalPt,
			};
		});
	});
}
