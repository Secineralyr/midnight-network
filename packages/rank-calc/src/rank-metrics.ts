import type { RankNumber } from '@midnight-network/shared/rank-status-system';
import { maximumRankNumber } from '@midnight-network/shared/rank-status-system';

const expectedPercentileMinimum = 0.03;
const expectedPercentileMaximum = 0.97;
const maximumExpectedPlacementDistance = 30;

/**
 * ランク番号を正規化した値(0.0〜1.0)を返します。
 *
 * @param rankNumber ランク番号(0=Ø, 12=Ⅰ)
 */
export function calculateNormalizedRankValue(rankNumber: RankNumber): number {
	return rankNumber / maximumRankNumber;
}

/**
 * ランク係数 λ を返します。
 *
 * @param rankNumber ランク番号(0=Ø, 12=Ⅰ)
 */
export function calculateRankFactor(rankNumber: RankNumber): number {
	const normalizedRank = calculateNormalizedRankValue(rankNumber);
	return 1 + 0.4 * normalizedRank;
}

/**
 * 期待順位中央値 E を返します。
 *
 * 期待順位はパーセンタイルで表し、各ランクで求められる範囲の中央値(切り捨て)を採用します。
 *
 * @param rankNumber ランク番号(0=Ø, 12=Ⅰ)
 * @param participantCount 参加人数(フライング除外)
 */
export function calculateExpectedMedianPlacement(rankNumber: RankNumber, participantCount: number): number {
	const normalizedRank = calculateNormalizedRankValue(rankNumber);
	const expectedPercentile =
		expectedPercentileMinimum + (expectedPercentileMaximum - expectedPercentileMinimum) * (1 - normalizedRank);
	const participantCountMinusOne = Math.max(participantCount - 1, 0);

	return 1 + Math.floor(expectedPercentile * participantCountMinusOne);
}

/**
 * 最終加算ptの最大上昇値を返します。
 *
 * @param rankNumber ランク番号(0=Ø, 12=Ⅰ)
 */
export function calculateMaximumGainLimit(rankNumber: RankNumber): number {
	const normalizedRank = calculateNormalizedRankValue(rankNumber);
	return 500 + 200 * (1 - normalizedRank);
}

/**
 * 最終加算ptの最大降下値を返します。(負の値)
 *
 * @param rankNumber ランク番号(0=Ø, 12=Ⅰ)
 */
export function calculateMaximumLossLimit(rankNumber: RankNumber): number {
	const normalizedRank = calculateNormalizedRankValue(rankNumber);
	return -(600 + 400 * normalizedRank);
}

/**
 * 期待順位からの距離の上限値 Lmax を返します。
 */
export function getMaximumExpectedPlacementDistance(): number {
	return maximumExpectedPlacementDistance;
}
