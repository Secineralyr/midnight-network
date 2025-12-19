import type { RankNumber } from '@midnight-network/shared/rank-status-system';
import { noRankPoints, rankPointThresholds } from '@midnight-network/shared/rank-status-system';

const minimumParticipationCountForRank = 5;

/**
 * 総ポイントと総参加回数から、現在のランク状態を求めます。
 *
 * No Rank はランクではなく、以下の状態を表します。
 * - 未参加/不参加などでポイントが 0
 * - 総参加回数が一定数に満たない
 *
 * @param totalPoints 総ポイント
 * @param totalParticipationCount 総参加回数
 */
export function calculateRankStatusFromTotalPoints(
	totalPoints: number,
	totalParticipationCount: number,
): { rankNumber: RankNumber; isNoRank: boolean } {
	if (totalParticipationCount < minimumParticipationCountForRank) {
		return { rankNumber: 0, isNoRank: true };
	}
	if (totalPoints <= noRankPoints) {
		return { rankNumber: 0, isNoRank: true };
	}

	for (const threshold of rankPointThresholds) {
		if (totalPoints >= threshold.minimumPoints) {
			return { rankNumber: threshold.rankNumber, isNoRank: false };
		}
	}

	return { rankNumber: 0, isNoRank: true };
}

/**
 * 指定したランクのボーダー(下限)ポイントを返します。
 *
 * @param rankNumber ランク番号(0=Ø, 12=Ⅰ)
 */
export function getMinimumPointsForRankNumber(rankNumber: RankNumber): number {
	for (const threshold of rankPointThresholds) {
		if (threshold.rankNumber === rankNumber) {
			return threshold.minimumPoints;
		}
	}
	throw new Error(`未知のrankNumberです: ${rankNumber}`);
}
