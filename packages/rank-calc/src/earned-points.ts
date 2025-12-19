import type { RankNumber, RankStreakState, WithinZoneRankSnapshot } from '@midnight-network/shared/rank-status-system';

import { calculateExpectedMedianPlacement, calculateNormalizedRankValue, calculateRankFactor } from './rank-metrics.js';

const basePoints = 40;

/**
 * 参加時の獲得pt(基礎pt + ボーナスpt)を計算します。
 *
 * 参加していない/フライングの場合は、この関数ではなく呼び出し側で 0 と扱います。
 *
 * @param rankNumber 現在ランク番号(0=Ø, 12=Ⅰ)
 * @param participantCount 参加人数(フライング除外)
 * @param placement 自順位
 * @param timeSeconds 自タイム(s)
 * @param withinZoneParticipants 圏内プレイヤーの順位とランクスナップショット
 * @param isWithinZone 自分が圏内かどうか
 * @param streak 今回のストリーク状態(今回分を反映済み)
 */
export function calculateEarnedPoints(params: {
	rankNumber: RankNumber;
	participantCount: number;
	placement: number;
	timeSeconds: number;
	withinZoneParticipants: readonly WithinZoneRankSnapshot[];
	isWithinZone: boolean;
	streak: RankStreakState;
}): number {
	const normalizedRank = calculateNormalizedRankValue(params.rankNumber);
	const rankFactor = calculateRankFactor(params.rankNumber);

	const basePointValue = basePoints * rankFactor;
	const upsetBonusPoints = calculateUpsetBonusPoints({
		currentRankNumber: params.rankNumber,
		selfPlacement: params.placement,
		withinZoneParticipants: params.withinZoneParticipants,
		isWithinZone: params.isWithinZone,
	});
	const expectationBonusPoints = calculateExpectationBonusPoints({
		normalizedRank,
		expectedMedianPlacement: calculateExpectedMedianPlacement(params.rankNumber, params.participantCount),
		selfPlacement: params.placement,
	});
	const participationStreakBonusPoints = calculateParticipationStreakBonusPoints(params.streak.consecutiveParticipationDays);
	const withinZoneStreakBonusPoints = params.isWithinZone
		? calculateWithinZoneStreakBonusPoints(params.streak.consecutiveWithinZoneDays)
		: 0;
	const theoryBonusPoints = calculateTheoryBonusPoints(params.timeSeconds);

	return (
		basePointValue +
		upsetBonusPoints +
		expectationBonusPoints +
		participationStreakBonusPoints +
		withinZoneStreakBonusPoints +
		theoryBonusPoints
	);
}

/**
 * アップセット(下剋上)ボーナスを計算します。
 *
 * @param currentRankNumber 自身の現在ランク番号
 * @param selfPlacement 自順位
 * @param withinZoneParticipants 圏内プレイヤーの順位とランク
 * @param isWithinZone 自身が圏内かどうか
 */
export function calculateUpsetBonusPoints(params: {
	currentRankNumber: RankNumber;
	selfPlacement: number;
	withinZoneParticipants: readonly WithinZoneRankSnapshot[];
	isWithinZone: boolean;
}): number {
	if (!params.isWithinZone) {
		return 0;
	}

	let upsetBonusPoints = 0;
	for (const participant of params.withinZoneParticipants) {
		if (params.selfPlacement < participant.placement && params.currentRankNumber < participant.rankNumber) {
			upsetBonusPoints += 10 * (participant.rankNumber - params.currentRankNumber);
		}
	}

	return upsetBonusPoints;
}

/**
 * 期待以上ボーナスを計算します。
 *
 * @param normalizedRank 正規化ランク(0.0〜1.0)
 * @param expectedMedianPlacement 期待順位中央値
 * @param selfPlacement 自順位
 */
export function calculateExpectationBonusPoints(params: {
	normalizedRank: number;
	expectedMedianPlacement: number;
	selfPlacement: number;
}): number {
	const betterDistance = Math.min(Math.max(params.expectedMedianPlacement - params.selfPlacement, 0), 30);
	const coefficient = 5 * params.normalizedRank;
	return coefficient * betterDistance;
}

/**
 * 連続参加ボーナスを計算します。(2日目から反映)
 *
 * @param consecutiveParticipationDays 連続参加日数(今回分を反映済み)
 */
export function calculateParticipationStreakBonusPoints(consecutiveParticipationDays: number): number {
	if (consecutiveParticipationDays <= 1) {
		return 0;
	}
	return Math.min(consecutiveParticipationDays - 1, 50);
}

/**
 * 連続圏内ボーナスを計算します。(2日目から反映)
 *
 * @param consecutiveWithinZoneDays 連続圏内日数(今回分を反映済み)
 */
export function calculateWithinZoneStreakBonusPoints(consecutiveWithinZoneDays: number): number {
	if (consecutiveWithinZoneDays <= 1) {
		return 0;
	}
	return Math.min(5 * (consecutiveWithinZoneDays - 1), 100);
}

/**
 * 理論値ボーナスを計算します。
 *
 * @param timeSeconds 自タイム(s)
 */
export function calculateTheoryBonusPoints(timeSeconds: number): number {
	if (timeSeconds === 0) {
		return 250;
	}
	if (timeSeconds >= -0.001 && timeSeconds <= 0.001) {
		return 100;
	}
	return 0;
}
