// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RankNumber } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { calculateRankStatusFromTotalPoints, getMinimumPointsForRankNumber } from './rank-number.js';

describe('総ポイントからランク状態を算出', () => {
	it('参加回数が基準未満ならノーランクになる', () => {
		expect(calculateRankStatusFromTotalPoints(9999, 4)).toEqual({ rankNumber: 0, isNoRank: true });
	});

	it('総ポイントが0以下ならノーランクになる', () => {
		expect(calculateRankStatusFromTotalPoints(0, 5)).toEqual({ rankNumber: 0, isNoRank: true });
		expect(calculateRankStatusFromTotalPoints(-10, 5)).toEqual({ rankNumber: 0, isNoRank: true });
	});

	it('総ポイントが1以上かつ参加回数が基準以上ならØになる', () => {
		expect(calculateRankStatusFromTotalPoints(1, 5)).toEqual({ rankNumber: 0, isNoRank: false });
	});

	it('閾値に応じて正しいランク番号を返す', () => {
		expect(calculateRankStatusFromTotalPoints(500, 5)).toEqual({ rankNumber: 1, isNoRank: false });
		expect(calculateRankStatusFromTotalPoints(6000, 5)).toEqual({ rankNumber: 12, isNoRank: false });
	});
});

describe('ランクのボーダーポイント取得', () => {
	it('ボーダーポイントを返す', () => {
		expect(getMinimumPointsForRankNumber(0)).toBe(1);
		expect(getMinimumPointsForRankNumber(1)).toBe(500);
		expect(getMinimumPointsForRankNumber(12)).toBe(6000);
	});

	it('未知のランク番号は例外を投げる', () => {
		expect(() => getMinimumPointsForRankNumber(99 as unknown as RankNumber)).toThrow();
	});
});
