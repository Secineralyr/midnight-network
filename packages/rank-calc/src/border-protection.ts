// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { BorderProtectionState, RankNumber } from '@midnight-network/shared/rank-status-system';

import { calculateNormalizedRankValue } from './rank-metrics.js';
import { getMinimumPointsForRankNumber } from './rank-number.js';

/**
 * プロテクト消費後に設定するクールタイム(日数)を計算します。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 */
export function calculateBorderProtectionCooldownDays(rankNumber: RankNumber): number {
	const normalizedRank = calculateNormalizedRankValue(rankNumber);
	return 5 + Math.floor(10 * normalizedRank);
}

/**
 * ボーダープロテクトを適用し、必要に応じてクールタイムを更新します。
 *
 * 発動条件:
 * - 不参加ではない
 * - ランク降格が発生する
 * - クールタイムが 0 以下
 * - 現在ランクが Ø ではない
 *
 * 降格が発生せず、かつ参加している場合はクールタイムを 1 減算します(0未満にはしない)。
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
	const currentCooldownDays = params.previousBorderProtection.cooldownDays;
	const isCooldownReady = currentCooldownDays <= 0;
	const canUseBorderProtection = params.isParticipating && isDemoted && isCooldownReady && params.currentRankNumber !== 0;

	if (canUseBorderProtection) {
		const requiredCooldownDays = calculateBorderProtectionCooldownDays(params.currentRankNumber);
		const nextCooldownDays = Math.max(0, currentCooldownDays) + requiredCooldownDays;

		return {
			nextTotalPoints: getMinimumPointsForRankNumber(params.currentRankNumber),
			nextBorderProtection: { cooldownDays: nextCooldownDays },
			usedBorderProtection: true,
		};
	}

	if (!isDemoted && params.isParticipating) {
		const nextCooldownDays = Math.max(0, currentCooldownDays - 1);
		return {
			nextTotalPoints: params.provisionalNextTotalPoints,
			nextBorderProtection: { cooldownDays: nextCooldownDays },
			usedBorderProtection: false,
		};
	}

	return {
		nextTotalPoints: params.provisionalNextTotalPoints,
		nextBorderProtection: { cooldownDays: currentCooldownDays },
		usedBorderProtection: false,
	};
}
