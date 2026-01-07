import { RankType } from '@midnight-network/shared/rank';
import type { UserResponseT } from '@midnight-network/shared/rpc/user/models';
import { prisma } from '../../db';
import {
	calculatePointsToNextRank,
	calculateRankFromPoints,
	calculateRemainingParticipationCount,
	rankNumberToRankTypeValue,
} from './rank';

type GetReturnPromiseT<F> = F extends (...args: infer _) => Promise<infer T> ? T : never;

export const statisticsSelector = {
	id: true,
	userRankStatuses: {
		select: {
			pt: true,
			streakParticipationAt: true,
			streakAbsenceAt: true,
			streakWithinTopAt: true,
			streakFlyingAt: true,
			protectCoolTime: true,
		},
	},
	userAveragePlace: { select: { averagePlace: true } },
	deltaTimeMsAvg: { select: { dtAvg: true } },
	userFlyingCount: { select: { flyingCount: true } },
	earlyLateTime: { select: { earlyTime: true, lateTime: true } },
	userMaxPlace: { select: { maxPlace: true } },
	userParticipantsCount: { select: { participantsCount: true } },
	winCount: { select: { winCount: true } },
	userWithinCount: { select: { withinCount: true } },
	winRate: { select: { wr: true } },
	userSettings: {
		select: { showProfileStats: true },
	},
} as const;

export async function getUserWithStatistics(userId: string) {
	return await prisma.user.findUnique({
		where: { id: userId, banned: false },
		select: statisticsSelector,
	});
}

export function makeStatistics(
	stats: NonNullable<GetReturnPromiseT<typeof getUserWithStatistics>>,
): NonNullable<UserResponseT>['statistics'] {
	const isNonStats =
		stats.userParticipantsCount?.participantsCount !== undefined && stats.userParticipantsCount.participantsCount > 0;
	if (isNonStats) {
		return undefined;
	}

	return {
		totalParticipationCount: stats.userParticipantsCount?.participantsCount ?? 0,
		averagePlace: stats.userAveragePlace?.averagePlace ?? 0,
		maxPlace: stats.userMaxPlace?.maxPlace ?? 0,
		winCount: stats.winCount?.winCount ?? 0,
		withinCount: stats.userWithinCount?.withinCount ?? 0,
		averageTime: stats.deltaTimeMsAvg?.dtAvg ?? 0,
		wr: stats.winRate?.wr ?? 0,
		lateTime: stats.earlyLateTime?.lateTime ?? 0,
		earlyTime: stats.earlyLateTime?.earlyTime ?? 0,
		flyingCount: stats.userFlyingCount?.flyingCount ?? 0,
	};
}

export function makeRankStatus(
	rankStats: NonNullable<GetReturnPromiseT<typeof getUserWithStatistics>>['userRankStatuses'],
): NonNullable<UserResponseT>['rankStatus'] {
	return {
		totalPt: rankStats?.pt ?? 0,
		streakParticipationAt: rankStats?.streakParticipationAt ?? 0,
		streakAbsenceAt: rankStats?.streakAbsenceAt ?? 0,
		streakWithinTopAt: rankStats?.streakWithinTopAt ?? 0,
		streakFlyingAt: rankStats?.streakFlyingAt ?? 0,
		protectCoolTime: rankStats?.protectCoolTime ?? 0,
	};
}

export function makeCurrentRank(totalPt: number, participationCount: number): NonNullable<UserResponseT>['currentRank'] {
	const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);
	const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

	if (isNoRank) {
		return {
			rank: RankType.NoRank,
			remainingParticipationCount: calculateRemainingParticipationCount(participationCount),
		};
	}

	return {
		rank: rankValue as Exclude<typeof rankValue, typeof RankType.NoRank>,
		nextRankPt: calculatePointsToNextRank(totalPt, rankNumber),
	};
}
