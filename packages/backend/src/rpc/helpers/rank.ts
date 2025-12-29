import { RankType } from '@midnight-network/shared/rank';
import type { RankNumber } from '@midnight-network/shared/rank-status-system';
import { rankPointThresholds } from '@midnight-network/shared/rank-status-system';

/** RankTypeの値型 */
type RankTypeValue = (typeof RankType)[keyof typeof RankType];

/**
 * RankNumberからRankTypeの値に変換する。
 * @param rankNumber ランク番号（0-12）
 * @param isNoRank NoRankかどうか
 * @returns RankTypeの値
 */
export function rankNumberToRankTypeValue(rankNumber: RankNumber, isNoRank: boolean): RankTypeValue {
	if (isNoRank) {
		return RankType.NoRank;
	}

	const rankMap: Record<number, RankTypeValue> = {
		0: RankType.BeginnerBefore,
		1: RankType.BeginnerAfter,
		2: RankType.NormalBefore,
		3: RankType.NormalAfter,
		4: RankType.BronzeBefore,
		5: RankType.BronzeAfter,
		6: RankType.SilverBefore,
		7: RankType.SilverAfter,
		8: RankType.GoldBefore,
		9: RankType.GoldAfter,
		10: RankType.LuminalBefore,
		11: RankType.LuminalAfter,
		12: RankType.Tachyon,
	};

	return rankMap[rankNumber] ?? RankType.NoRank;
}

/**
 * 総ポイントからランク番号とNoRankフラグを計算する。
 * @param totalPoints 総ポイント
 * @param totalParticipationCount 総参加回数
 * @returns ランク番号とNoRankフラグ
 */
export function calculateRankFromPoints(
	totalPoints: number,
	totalParticipationCount: number,
): { rankNumber: RankNumber; isNoRank: boolean } {
	const minimumParticipationCount = 5;

	if (totalParticipationCount < minimumParticipationCount) {
		return { rankNumber: 0, isNoRank: true };
	}
	if (totalPoints <= 0) {
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
 * 次のランクに必要な残りポイントを計算する。
 * @param currentTotalPoints 現在の総ポイント
 * @param currentRankNumber 現在のランク番号
 * @returns 次のランクまでの残りポイント（最高ランクの場合は0）
 */
export function calculatePointsToNextRank(currentTotalPoints: number, currentRankNumber: RankNumber): number {
	if (currentRankNumber >= 12) {
		return 0;
	}

	const nextRankNumber = currentRankNumber + 1;
	const nextRankThreshold = rankPointThresholds.find((t) => t.rankNumber === nextRankNumber);
	if (!nextRankThreshold) {
		return 0;
	}

	return Math.max(0, nextRankThreshold.minimumPoints - currentTotalPoints);
}

/**
 * NoRankの場合、ランク付与までの残り参加回数を計算する。
 * @param totalParticipationCount 総参加回数
 * @returns 残り参加回数
 */
export function calculateRemainingParticipationCount(totalParticipationCount: number): number {
	const minimumParticipationCount = 5;
	return Math.max(0, minimumParticipationCount - totalParticipationCount);
}
