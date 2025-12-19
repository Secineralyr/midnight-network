import type {
	RankCalculationEvent,
	RankCalculationResult,
	RankProgressState,
} from '@midnight-network/shared/rank-status-system';

import { applyBorderProtection } from './border-protection.js';
import { calculatePointDelta } from './point-delta.js';
import { calculateRankStatusFromTotalPoints } from './rank-number.js';
import { calculateNextStreakState } from './streak-state.js';
import { applyUpdateRankReset } from './update-rank-reset.js';

export { applyUpdateRankReset };

/**
 * ランクステータスシステムの計算を行い、次状態を返します。
 *
 * - 最終加算ptは「上限/下限でクランプ → 四捨五入」の順で確定します
 * - ストリーク(連続カウント)は今回分を先に反映し、その値をボーナス/ペナルティに使用します
 * - プロテクトは降格が発生する場合のみ消費し、消費後は参加回数で回復します
 *
 * @param currentState 現在の進行状態
 * @param event 今回のイベント結果
 */
export function calculateRankUpdate(currentState: RankProgressState, event: RankCalculationEvent): RankCalculationResult {
	const { rankNumber: currentRankNumber } = calculateRankStatusFromTotalPoints(
		currentState.totalPoints,
		currentState.totalParticipationCount,
	);

	let isWithinZone = false;
	if (event.kind === 'participated') {
		let withinZoneCutoffPlacement = 0;
		for (const participant of event.withinZoneParticipants) {
			withinZoneCutoffPlacement = Math.max(withinZoneCutoffPlacement, participant.placement);
		}
		isWithinZone = event.placement <= withinZoneCutoffPlacement;
	}

	const nextStreak = calculateNextStreakState(currentState.streak, event, isWithinZone);
	const pointDelta = calculatePointDelta({
		rankNumber: currentRankNumber,
		totalPoints: currentState.totalPoints,
		event,
		isWithinZone,
		streak: nextStreak,
	});

	const participatedThisEvent = event.kind !== 'absent';
	const nextTotalParticipationCount = currentState.totalParticipationCount + (participatedThisEvent ? 1 : 0);

	const provisionalNextTotalPoints = Math.max(0, currentState.totalPoints + pointDelta);
	const { rankNumber: provisionalNextRankNumber } = calculateRankStatusFromTotalPoints(
		provisionalNextTotalPoints,
		nextTotalParticipationCount,
	);

	const borderProtectionResult = applyBorderProtection({
		currentRankNumber,
		provisionalNextRankNumber,
		provisionalNextTotalPoints,
		isParticipating: participatedThisEvent,
		previousBorderProtection: currentState.borderProtection,
	});

	const { rankNumber: nextRankNumber, isNoRank: nextIsNoRank } = calculateRankStatusFromTotalPoints(
		borderProtectionResult.nextTotalPoints,
		nextTotalParticipationCount,
	);

	return {
		pointDelta,
		nextTotalPoints: borderProtectionResult.nextTotalPoints,
		nextRankNumber,
		nextIsNoRank,
		nextTotalParticipationCount,
		nextStreak,
		nextBorderProtection: borderProtectionResult.nextBorderProtection,
		usedBorderProtection: borderProtectionResult.usedBorderProtection,
	};
}
