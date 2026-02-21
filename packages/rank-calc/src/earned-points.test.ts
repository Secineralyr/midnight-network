// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RankStreakState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import {
	calculateEarnedPoints,
	calculateExpectationBonusPoints,
	calculateParticipationStreakBonusPoints,
	calculateTheoryBonusPoints,
	calculateUpsetBonusPoints,
	calculateWithinZoneStreakBonusPoints,
} from './earned-points.js';

describe('理論値ボーナスの計算', () => {
	it('タイムに応じて理論値ボーナスを返す', () => {
		expect(calculateTheoryBonusPoints(0)).toBe(250);
		expect(calculateTheoryBonusPoints(0.0005)).toBe(100);
		expect(calculateTheoryBonusPoints(0.01)).toBe(0);
	});
});

describe('連続参加ボーナスの計算', () => {
	it('2日目から加算し、最大50で打ち止めになる', () => {
		expect(calculateParticipationStreakBonusPoints(1)).toBe(0);
		expect(calculateParticipationStreakBonusPoints(2)).toBe(1);
		expect(calculateParticipationStreakBonusPoints(999)).toBe(50);
	});
});

describe('連続圏内ボーナスの計算', () => {
	it('2日目から加算し、最大100で打ち止めになる', () => {
		expect(calculateWithinZoneStreakBonusPoints(1)).toBe(0);
		expect(calculateWithinZoneStreakBonusPoints(2)).toBe(5);
		expect(calculateWithinZoneStreakBonusPoints(30)).toBe(100);
	});
});

describe('期待以上ボーナスの計算', () => {
	it('期待順位を上回らない場合は0で、距離は30で上限になる', () => {
		expect(calculateExpectationBonusPoints({ normalizedRank: 1, expectedMedianPlacement: 10, selfPlacement: 20 })).toBe(0);
		expect(calculateExpectationBonusPoints({ normalizedRank: 1, expectedMedianPlacement: 100, selfPlacement: 1 })).toBe(
			150,
		);
	});
});

describe('アップセットボーナスの計算', () => {
	it('圏外の場合は0を返す', () => {
		expect(
			calculateUpsetBonusPoints({
				currentRankNumber: 4,
				selfPlacement: 2,
				withinZoneParticipants: [{ placement: 3, rankNumber: 6 }],
				isWithinZone: false,
			}),
		).toBe(0);
	});

	it('圏内で上位ランクのプレイヤーに勝つと加点する', () => {
		expect(
			calculateUpsetBonusPoints({
				currentRankNumber: 4,
				selfPlacement: 2,
				withinZoneParticipants: [
					{ placement: 5, rankNumber: 6 },
					{ placement: 1, rankNumber: 12 },
					{ placement: 6, rankNumber: 3 },
				],
				isWithinZone: true,
			}),
		).toBe(20);
	});
});

describe('獲得ポイントの計算', () => {
	it('ボーナス条件がない場合は基礎ポイントのみを返す', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 1,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};

		expect(
			calculateEarnedPoints({
				rankNumber: 0,
				participantCount: 10,
				placement: 1,
				timeSeconds: 1,
				withinZoneParticipants: [],
				isWithinZone: false,
				streak,
			}),
		).toBe(40);
	});

	it('条件に応じて複数のボーナスが加算される', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 2,
			consecutiveWithinZoneDays: 2,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};

		expect(
			calculateEarnedPoints({
				rankNumber: 12,
				participantCount: 100,
				placement: 1,
				timeSeconds: 0,
				withinZoneParticipants: [
					{ placement: 1, rankNumber: 12 },
					{ placement: 2, rankNumber: 12 },
				],
				isWithinZone: true,
				streak,
			}),
		).toBe(322);
	});
});
