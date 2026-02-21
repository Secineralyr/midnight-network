// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';

import {
	calculateExpectedMedianPlacement,
	calculateMaximumGainLimit,
	calculateMaximumLossLimit,
	calculateNormalizedRankValue,
	calculateRankFactor,
	getMaximumExpectedPlacementDistance,
} from './rank-metrics.js';

describe('ランク正規化値の計算', () => {
	it('ランク番号を0.0〜1.0に正規化する', () => {
		expect(calculateNormalizedRankValue(0)).toBe(0);
		expect(calculateNormalizedRankValue(6)).toBe(0.5);
		expect(calculateNormalizedRankValue(12)).toBe(1);
	});
});

describe('ランク係数の計算', () => {
	it('ランク番号からλを計算する', () => {
		expect(calculateRankFactor(0)).toBe(1);
		expect(calculateRankFactor(12)).toBe(1.4);
	});
});

describe('期待順位中央値の計算', () => {
	it('参加人数が1なら常に1位になる', () => {
		expect(calculateExpectedMedianPlacement(0, 1)).toBe(1);
		expect(calculateExpectedMedianPlacement(12, 1)).toBe(1);
	});

	it('ランクに応じた期待順位中央値を返す', () => {
		expect(calculateExpectedMedianPlacement(0, 100)).toBe(97);
		expect(calculateExpectedMedianPlacement(12, 100)).toBe(3);
	});
});

describe('最大上昇値と最大降下値の計算', () => {
	it('ランクに応じた最大上昇/降下値を計算する', () => {
		expect(calculateMaximumGainLimit(0)).toBe(700);
		expect(calculateMaximumGainLimit(12)).toBe(500);
		expect(calculateMaximumLossLimit(0)).toBe(-600);
		expect(calculateMaximumLossLimit(12)).toBe(-1000);
	});
});

describe('期待順位距離の上限値', () => {
	it('距離の上限(30)を返す', () => {
		expect(getMaximumExpectedPlacementDistance()).toBe(30);
	});
});
