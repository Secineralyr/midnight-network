import type {
	GetSettingsParamsT,
	GetSettingsResponseT,
	LastResultParamsT,
	LastResultResponseT,
	SetSettingsParamsT,
	SetSettingsResponseT,
} from '@midnight-network/shared/rpc/me/models';
import { RankShiftType } from '@midnight-network/shared/rpc/me/models';
import { prisma } from '../../db';
import type { AuthContext } from '../../rpc';
import { withCache } from '../helpers/cache';
import { calculateTimeDifferenceSeconds, getLatestMatchDate } from '../helpers/match';
import { calculateRankFromPoints, rankNumberToRankTypeValue } from '../helpers/rank';

/**
 * ログインユーザーの最新リザルトを取得する。
 * @param ctx 認証コンテキスト
 * @param _input 未使用
 * @returns 最新リザルト、存在しない場合はundefined
 */
export async function lastResult(ctx: AuthContext, _input: LastResultParamsT): Promise<LastResultResponseT> {
	const userId = ctx.user?.id;
	if (!userId) {
		return undefined;
	}

	return await withCache(`lastResult:${userId}`, null, async () => {
		const latestMatch = await getLatestMatchDate();
		if (!latestMatch) {
			return undefined;
		}

		const record = await prisma.record.findFirst({
			where: {
				userId,
				matchDateId: latestMatch.id,
			},
			select: {
				place: true,
				postedAt: true,
				matchDate: {
					select: { date: true },
				},
			},
		});

		if (!record) {
			return undefined;
		}

		const rankHistory = await prisma.userRankHistory.findFirst({
			where: {
				userId,
				matchId: latestMatch.id,
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

		const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);
		const totalPt = userRankStatus?.pt ?? 0;
		const participationCount = user?.records.length ?? 0;
		const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);
		const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

		const previousRankHistory = await prisma.userRankHistory.findFirst({
			where: {
				userId,
				matchId: {
					not: latestMatch.id,
				},
			},
			orderBy: {
				matchId: 'desc',
			},
			select: {
				pt: true,
			},
		});

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
