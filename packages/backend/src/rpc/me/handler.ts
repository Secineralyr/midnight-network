// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RankType } from '@midnight-network/shared/rank';
import type {
	GetPushStatusParamsT,
	GetPushStatusResponseT,
	GetSettingsParamsT,
	GetSettingsResponseT,
	LastResultParamsT,
	LastResultResponseT,
	SetSettingsParamsT,
	SetSettingsResponseT,
	SubscribePushParamsT,
	SubscribePushResponseT,
	UnsubscribePushParamsT,
	UnsubscribePushResponseT,
	UserInfoResponseT,
} from '@midnight-network/shared/rpc/me/models';
import { RankShiftType } from '@midnight-network/shared/rpc/me/models';
import { ORPCError } from '@orpc/server';
import type { UserInfoParamsT } from '../../../../shared/src/rpc/me/models';
import { prisma } from '../../db';
import type { AuthContext } from '../../rpc';
import { withCache } from '../helpers/cache';
import { calculateTimeDifferenceSeconds } from '../helpers/match';
import { parsePushSubscriptions } from '../helpers/push';
import { calculateRankFromPoints, rankNumberToRankTypeValue } from '../helpers/rank';
import { makeCurrentRank } from '../helpers/stats';

/**
 * ログインユーザーの最新リザルトを取得する。
 * @param ctx 認証コンテキスト
 * @param _input 未使用
 * @returns 最新リザルト、存在しない場合はundefined
 */
export async function lastResult(ctx: AuthContext, _input: LastResultParamsT): Promise<LastResultResponseT> {
	const userId = ctx.user?.id;
	console.info('rpc.me.lastResult', userId);
	if (!userId) {
		return undefined;
	}

	return await withCache(`lastResult:${userId}`, null, async () => {
		// ユーザーの最新のリザルトを取得（最新の試合ではなく、ユーザーが参加した直近の試合）
		const record = await prisma.record.findFirst({
			where: {
				userId,
			},
			orderBy: {
				matchDate: { date: 'desc' },
			},
			select: {
				place: true,
				postedAt: true,
				matchDateId: true,
				matchDate: {
					select: { date: true },
				},
			},
		});

		if (!record) {
			console.info('rpc.me.lastResult.noRecord', userId);
			return undefined;
		}

		const rankHistory = await prisma.userRankHistory.findFirst({
			where: {
				userId,
				matchId: record.matchDateId,
			},
			select: {
				pt: true,
				earnedPt: true,
			},
		});

		const userRankStatus = await prisma.userRankStatus.findUnique({
			where: { id: userId },
			select: { pt: true },
		});

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				records: {
					select: { id: true },
				},
			},
		});
		console.info('rpc.me.lastResult.userFound', Boolean(user));

		const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);
		const totalPt = userRankStatus?.pt ?? 0;
		const participationCount = user?.records.length ?? 0;
		const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);
		const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

		const previousRankHistory = await prisma.userRankHistory.findFirst({
			where: {
				userId,
				matchId: {
					not: record.matchDateId,
				},
			},
			orderBy: {
				matchId: 'desc',
			},
			select: {
				pt: true,
			},
		});
		console.info('rpc.me.lastResult.previousRankHistory', Boolean(previousRankHistory));

		let rankShift: (typeof RankShiftType)[keyof typeof RankShiftType] = RankShiftType.None;
		if (previousRankHistory) {
			const previousPt = previousRankHistory.pt;
			const currentPt = rankHistory?.pt ?? totalPt;

			const previousRank = calculateRankFromPoints(previousPt, participationCount - 1);
			const currentRank = calculateRankFromPoints(currentPt, participationCount);

			if (currentRank.rankNumber > previousRank.rankNumber) {
				rankShift = RankShiftType.RankUp;
			} else if (currentRank.rankNumber < previousRank.rankNumber) {
				rankShift = RankShiftType.RankDown;
			}
		}

		return {
			targetDate: record.matchDate.date,
			place: record.place,
			time: timeDiff,
			earnedPt: rankHistory?.earnedPt ?? 0,
			latestTotalPt: totalPt,
			latestRank: rankValue,
			rankShift,
		};
	});
}

/**
 * 現在の設定状態を取得する。
 * @param ctx 認証コンテキスト
 * @param _input 未使用
 * @returns 設定状態
 */
export async function getSettings(ctx: AuthContext, _input: GetSettingsParamsT): Promise<GetSettingsResponseT> {
	const userId = ctx.user?.id;
	console.info('rpc.me.getSettings', userId);
	if (!userId) {
		return {
			showLeaderboardRank: true,
			showLeaderboardRanking: true,
			showProfileStats: true,
			showProfileSearch: true,
		};
	}

	const settings = await prisma.userSettings.findUnique({
		where: { id: userId },
		select: {
			showLeaderboardRank: true,
			showLeaderboardRanking: true,
			showProfileStats: true,
			showProfileSearch: true,
		},
	});

	return (
		settings ?? {
			showLeaderboardRank: true,
			showLeaderboardRanking: true,
			showProfileStats: true,
			showProfileSearch: true,
		}
	);
}

/**
 * 現在の設定状態を反映する。
 * @param ctx 認証コンテキスト
 * @param input 更新する設定（部分更新可能）
 */
export async function setSettings(ctx: AuthContext, input: SetSettingsParamsT): Promise<SetSettingsResponseT> {
	const userId = ctx.user?.id;
	console.info('rpc.me.setSettings', userId);
	if (!userId) {
		return;
	}

	await prisma.userSettings.upsert({
		where: { id: userId },
		update: {
			...(input.showLeaderboardRank !== undefined && { showLeaderboardRank: input.showLeaderboardRank }),
			...(input.showLeaderboardRanking !== undefined && { showLeaderboardRanking: input.showLeaderboardRanking }),
			...(input.showProfileStats !== undefined && { showProfileStats: input.showProfileStats }),
			...(input.showProfileSearch !== undefined && { showProfileSearch: input.showProfileSearch }),
		},
		create: {
			id: userId,
			showLeaderboardRank: input.showLeaderboardRank ?? true,
			showLeaderboardRanking: input.showLeaderboardRanking ?? true,
			showProfileStats: input.showProfileStats ?? true,
			showProfileSearch: input.showProfileSearch ?? true,
		},
	});
}

/**
 * ログインユーザー情報を取得する
 * @param ctx 認証コンテキスト
 * @param input 更新する設定（部分更新可能）
 */
export async function userInfo(ctx: AuthContext, _: UserInfoParamsT): Promise<UserInfoResponseT> {
	const userId = ctx.user?.id;
	console.info('rpc.me.userInfo', userId);
	if (!userId) {
		throw new ORPCError('NOT_FOUND', { message: 'userId is not found.' });
	}

	return await withCache(`userInfo:${userId}`, null, async () => {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				userName: true,
				userParticipantsCount: {
					select: {
						participantsCount: true,
					},
				},
				userRankStatuses: {
					select: {
						pt: true,
					},
				},
			},
		});

		if (!user) {
			return {
				id: userId,
				latestRank: RankType.NoRank,
				username: ctx.user?.name ?? '?',
			};
		}

		const rank = makeCurrentRank(user.userRankStatuses?.pt ?? 0, user?.userParticipantsCount?.participantsCount ?? 0);

		return {
			id: user.id,
			username: user.userName,
			latestRank: rank.rank,
		};
	});
}

/**
 * Push通知のサブスクリプションを登録する。
 */
export async function subscribePush(ctx: AuthContext, input: SubscribePushParamsT): Promise<SubscribePushResponseT> {
	const userId = ctx.user?.id;
	console.info(`rpc.me.subscribePush: ${userId}`);
	if (!userId) {
		return;
	}

	const authUser = await prisma.authUser.findUnique({
		where: { id: userId },
		select: { pushSubscriptions: true },
	});

	const subs = parsePushSubscriptions(authUser?.pushSubscriptions);
	const existing = subs.findIndex((s) => s.endpoint === input.endpoint);
	if (existing >= 0) {
		subs[existing] = { endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth };
	} else {
		subs.push({ endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth });
	}

	await prisma.authUser.update({
		where: { id: userId },
		data: { pushSubscriptions: JSON.stringify(subs) },
	});
}

/**
 * Push通知のサブスクリプションを解除する。
 */
export async function unsubscribePush(ctx: AuthContext, input: UnsubscribePushParamsT): Promise<UnsubscribePushResponseT> {
	const userId = ctx.user?.id;
	console.info(`rpc.me.unsubscribePush: ${userId}`);
	if (!userId) {
		return;
	}

	const authUser = await prisma.authUser.findUnique({
		where: { id: userId },
		select: { pushSubscriptions: true },
	});

	const subs = parsePushSubscriptions(authUser?.pushSubscriptions).filter((s) => s.endpoint !== input.endpoint);

	await prisma.authUser.update({
		where: { id: userId },
		data: { pushSubscriptions: subs.length > 0 ? JSON.stringify(subs) : null },
	});
}

/**
 * Push通知の購読状態を取得する。
 */
export async function getPushStatus(ctx: AuthContext, _input: GetPushStatusParamsT): Promise<GetPushStatusResponseT> {
	const userId = ctx.user?.id;
	console.info(`rpc.me.getPushStatus: ${userId}`);
	if (!userId) {
		return { enabled: false, endpoints: [] };
	}

	const authUser = await prisma.authUser.findUnique({
		where: { id: userId },
		select: { pushSubscriptions: true },
	});

	const subs = parsePushSubscriptions(authUser?.pushSubscriptions);
	return {
		enabled: subs.length > 0,
		endpoints: subs.map((s) => s.endpoint),
	};
}
