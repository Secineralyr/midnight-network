import type { RankCalculationEvent, RankNumber, RankStreakState } from '@midnight-network/shared/rank-status-system';

import { calculateEarnedPoints } from './earned-points.js';
import { calculatePenaltyPoints } from './penalty-points.js';
import { calculateMaximumGainLimit, calculateMaximumLossLimit } from './rank-metrics.js';

/**
 * 最終加算pt(丸め・上限下限適用済み)を計算します。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param totalPoints 総ポイント(今回の加算前)
 * @param event 今回のイベント結果
 * @param isWithinZone 自分が圏内かどうか(参加イベントのみ有効)
 * @param streak 今回のストリーク状態(今回分を反映済み)
 */
export function calculatePointDelta(params: {
	rankNumber: RankNumber;
	totalPoints: number;
	event: RankCalculationEvent;
	isWithinZone: boolean;
	streak: RankStreakState;
}): number {
	const earnedPoints =
		params.event.kind === 'participated'
			? calculateEarnedPoints({
					rankNumber: params.rankNumber,
					participantCount: params.event.participantCount,
					placement: params.event.placement,
					timeSeconds: params.event.timeSeconds,
					withinZoneParticipants: params.event.withinZoneParticipants,
					isWithinZone: params.isWithinZone,
					streak: params.streak,
				})
			: 0;

	const eventMultiplierCandidate = params.event.eventMultiplier ?? 1;
	const eventMultiplier = Number.isFinite(eventMultiplierCandidate) ? eventMultiplierCandidate : 1;

	const penaltyPoints = calculatePenaltyPoints({
		rankNumber: params.rankNumber,
		totalPoints: params.totalPoints,
		event: params.event,
		isWithinZone: params.isWithinZone,
		streak: params.streak,
	});

	const rawPointDelta = earnedPoints * eventMultiplier - penaltyPoints;

	const maximumGainLimit = calculateMaximumGainLimit(params.rankNumber);
	const maximumLossLimit = calculateMaximumLossLimit(params.rankNumber);
	const clampedPointDelta = Math.min(maximumGainLimit, Math.max(maximumLossLimit, rawPointDelta));

	return Math.round(clampedPointDelta);
}
