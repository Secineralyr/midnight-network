// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RankNumber, RankProgressState } from '@midnight-network/shared/rank-status-system';

import { calculateRankStatusFromTotalPoints, getMinimumPointsForRankNumber } from './rank-number.js';

const resetRankNumberByRankNumber = {
	0: 0,
	1: 1,
	2: 2,
	3: 2,
	4: 4,
	5: 4,
	6: 5,
	7: 6,
	8: 7,
	9: 8,
	10: 9,
	11: 10,
	12: 11,
} as const satisfies Record<RankNumber, RankNumber>;

/**
 * アップデート時のランクリセット(ランクカット)を適用します。
 *
 * - 「No Rank」は対象外とします
 * - ランクが変化する場合は、カット後ランクのボーダーptへ丸めます
 * - Ø / Ⅻ は「pt変化なし」とします
 *
 * @param currentState 現在の進行状態
 */
export function applyUpdateRankReset(currentState: RankProgressState): RankProgressState {
	const { rankNumber: currentRankNumber, isNoRank } = calculateRankStatusFromTotalPoints(
		currentState.totalPoints,
		currentState.totalParticipationCount,
	);
	if (isNoRank) {
		return currentState;
	}

	const cutRankNumber = resetRankNumberByRankNumber[currentRankNumber];
	const keepPointsUnchanged = currentRankNumber === 0 || currentRankNumber === 1;
	const nextTotalPoints = keepPointsUnchanged ? currentState.totalPoints : getMinimumPointsForRankNumber(cutRankNumber);

	return { ...currentState, totalPoints: Math.max(0, nextTotalPoints) };
}
