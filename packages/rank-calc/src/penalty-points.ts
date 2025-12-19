import type { RankCalculationEvent, RankNumber, RankStreakState } from '@midnight-network/shared/rank-status-system';

import { calculateExpectedMedianPlacement, calculateNormalizedRankValue, calculateRankFactor } from './rank-metrics.js';

/**
 * ペナルティptを計算します。
 *
 * - 参加: 期待以下 + 圏外
 * - 不参加: 不参加倍率 × 不参加ペナルティ
 * - フライング: フライング倍率 × (フライング + 連続フライング)
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param totalPoints 総ポイント(今回の加算前)
 * @param event 今回のイベント結果
 * @param isWithinZone 自分が圏内かどうか(参加イベントのみ有効)
 * @param streak 今回のストリーク状態(今回分を反映済み)
 */
export function calculatePenaltyPoints(params: {
	rankNumber: RankNumber;
	totalPoints: number;
	event: RankCalculationEvent;
	isWithinZone: boolean;
	streak: RankStreakState;
}): number {
	if (params.event.kind === 'absent') {
		return calculatePenaltyPointsForAbsence({
			rankNumber: params.rankNumber,
			totalPoints: params.totalPoints,
			consecutiveAbsenceDays: params.streak.consecutiveAbsenceDays,
		});
	}
	if (params.event.kind === 'flying') {
		return calculatePenaltyPointsForFlying({
			rankNumber: params.rankNumber,
			timeSeconds: params.event.timeSeconds,
			consecutiveFlyingCount: params.streak.consecutiveFlyingCount,
		});
	}

	return calculatePenaltyPointsForParticipation({
		rankNumber: params.rankNumber,
		participantCount: params.event.participantCount,
		placement: params.event.placement,
		isWithinZone: params.isWithinZone,
	});
}

/**
 * 参加時のペナルティpt(期待以下 + 圏外)を計算します。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param participantCount 参加人数(フライング除外)
 * @param placement 自順位
 * @param isWithinZone 自分が圏内かどうか
 */
export function calculatePenaltyPointsForParticipation(params: {
	rankNumber: RankNumber;
	participantCount: number;
	placement: number;
	isWithinZone: boolean;
}): number {
	const normalizedRank = calculateNormalizedRankValue(params.rankNumber);
	const expectedMedianPlacement = calculateExpectedMedianPlacement(params.rankNumber, params.participantCount);

	const worseDistance = Math.min(Math.max(params.placement - expectedMedianPlacement, 0), 30);
	const expectationPenalty = 7 * normalizedRank * worseDistance;

	if (params.isWithinZone) {
		return expectationPenalty;
	}

	const rankFactor = calculateRankFactor(params.rankNumber);
	const outOfZoneScale = Math.max(0, (params.rankNumber - 4) / 8);
	const outOfZonePenalty = 60 * outOfZoneScale * rankFactor;

	return expectationPenalty + outOfZonePenalty;
}

/**
 * 不参加時のペナルティptを計算します。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param totalPoints 総ポイント(今回の加算前)
 * @param consecutiveAbsenceDays 連続未参加日数(今回分を反映済み)
 */
export function calculatePenaltyPointsForAbsence(params: {
	rankNumber: RankNumber;
	totalPoints: number;
	consecutiveAbsenceDays: number;
}): number {
	const normalizedRank = calculateNormalizedRankValue(params.rankNumber);
	const absencePenaltyMultiplier = normalizedRank ** 4;

	let absencePenalty = 0;
	if (params.consecutiveAbsenceDays === 15) {
		absencePenalty = 0.3 * params.totalPoints;
	} else if (params.consecutiveAbsenceDays > 15) {
		absencePenalty = 0.1 * params.totalPoints;
	}

	return absencePenaltyMultiplier * absencePenalty;
}

/**
 * フライング時のペナルティptを計算します。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param timeSeconds 自タイム(s)
 * @param consecutiveFlyingCount 連続フライング回数(今回分を反映済み)
 */
export function calculatePenaltyPointsForFlying(params: {
	rankNumber: RankNumber;
	timeSeconds: number;
	consecutiveFlyingCount: number;
}): number {
	const flyingPenaltyMultiplier = params.timeSeconds >= -0.05 && params.timeSeconds < 0 ? 0.5 : 1;

	const normalizedRank = calculateNormalizedRankValue(params.rankNumber);
	const flyingPenalty = 30 + 50 * normalizedRank ** 2;
	const flyingStreakPenalty = params.consecutiveFlyingCount > 1 ? Math.min(30 * (params.consecutiveFlyingCount - 1), 150) : 0;

	return flyingPenaltyMultiplier * (flyingPenalty + flyingStreakPenalty);
}
