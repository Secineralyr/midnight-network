import type { BorderProtectionState, RankNumber } from '@midnight-network/shared/rank-status-system';

import { calculateNormalizedRankValue } from './rank-metrics.js';
import { getMinimumPointsForRankNumber } from './rank-number.js';

/**
 * プロテクト回復に必要な参加回数を計算します。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 */
export function calculateRequiredParticipationsForProtectionRecovery(rankNumber: RankNumber): number {
	const normalizedRank = calculateNormalizedRankValue(rankNumber);
	return 5 + Math.floor(10 * normalizedRank);
}

/**
 * ボーダープロテクトを適用し、必要に応じてプロテクト状態を更新します。
 *
 * 発動条件:
 * - 不参加ではない
 * - ランク降格が発生する
 * - プロテクトが回復している
 * - 現在ランクが Ø ではない
 *
 * @param currentRankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param provisionalNextRankNumber 加算後の暫定ランク番号
 * @param provisionalNextTotalPoints 加算後の暫定総ポイント
 * @param isParticipating 不参加ではないか
 * @param previousBorderProtection 前回までのプロテクト状態
 */
export function applyBorderProtection(params: {
	currentRankNumber: RankNumber;
	provisionalNextRankNumber: RankNumber;
	provisionalNextTotalPoints: number;
	isParticipating: boolean;
	previousBorderProtection: BorderProtectionState;
}): { nextTotalPoints: number; nextBorderProtection: BorderProtectionState; usedBorderProtection: boolean } {
	const isDemoted = params.provisionalNextRankNumber < params.currentRankNumber;
	const canUseBorderProtection =
		params.isParticipating && isDemoted && params.previousBorderProtection.isAvailable && params.currentRankNumber !== 0;

	if (canUseBorderProtection) {
		return {
			nextTotalPoints: getMinimumPointsForRankNumber(params.currentRankNumber),
			nextBorderProtection: { isAvailable: false, participationCountSinceUse: 0 },
			usedBorderProtection: true,
		};
	}

	if (params.previousBorderProtection.isAvailable) {
		return {
			nextTotalPoints: params.provisionalNextTotalPoints,
			nextBorderProtection: { isAvailable: true, participationCountSinceUse: 0 },
			usedBorderProtection: false,
		};
	}

	const updatedParticipationCountSinceUse = params.isParticipating
		? params.previousBorderProtection.participationCountSinceUse + 1
		: params.previousBorderProtection.participationCountSinceUse;

	const requiredCount = calculateRequiredParticipationsForProtectionRecovery(params.currentRankNumber);
	const isRecovered = updatedParticipationCountSinceUse >= requiredCount;

	return {
		nextTotalPoints: params.provisionalNextTotalPoints,
		nextBorderProtection: isRecovered
			? { isAvailable: true, participationCountSinceUse: 0 }
			: { isAvailable: false, participationCountSinceUse: updatedParticipationCountSinceUse },
		usedBorderProtection: false,
	};
}
