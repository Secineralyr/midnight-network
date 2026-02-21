// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RankCalculationEvent, RankStreakState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import {
	calculatePenaltyPoints,
	calculatePenaltyPointsForAbsence,
	calculatePenaltyPointsForFlying,
	calculatePenaltyPointsForParticipation,
} from './penalty-points.js';

describe('不参加ペナルティの計算', () => {
	it('15日目は大きく、以降は小さく減点する', () => {
		expect(calculatePenaltyPointsForAbsence({ rankNumber: 12, totalPoints: 1000, consecutiveAbsenceDays: 14 })).toBe(0);
		expect(calculatePenaltyPointsForAbsence({ rankNumber: 12, totalPoints: 1000, consecutiveAbsenceDays: 15 })).toBe(300);
		expect(calculatePenaltyPointsForAbsence({ rankNumber: 12, totalPoints: 1000, consecutiveAbsenceDays: 16 })).toBe(100);
	});

	it('ランクにより不参加倍率が変わる（ランク0は0）', () => {
		expect(calculatePenaltyPointsForAbsence({ rankNumber: 0, totalPoints: 1000, consecutiveAbsenceDays: 15 })).toBe(0);
	});
});

describe('フライングペナルティの計算', () => {
	it('ニアミスフライングは倍率が0.5になる', () => {
		expect(calculatePenaltyPointsForFlying({ rankNumber: 12, timeSeconds: -0.01, consecutiveFlyingCount: 1 })).toBe(40);
	});

	it('2回目以降は連続フライングペナルティが加算され、最大150で上限になる', () => {
		expect(calculatePenaltyPointsForFlying({ rankNumber: 12, timeSeconds: -0.1, consecutiveFlyingCount: 3 })).toBe(140);
	});
});

describe('参加時ペナルティの計算', () => {
	it('期待順位中央値からの距離で期待以下ペナルティを加える', () => {
		expect(
			calculatePenaltyPointsForParticipation({
				rankNumber: 12,
				participantCount: 100,
				placement: 50,
				isWithinZone: true,
			}),
		).toBe(210);
	});

	it('圏外の場合は圏外ペナルティも加える', () => {
		expect(
			calculatePenaltyPointsForParticipation({
				rankNumber: 12,
				participantCount: 100,
				placement: 50,
				isWithinZone: false,
			}),
		).toBe(294);
	});
});

describe('ペナルティの総合計算', () => {
	it('イベント種別に応じて計算処理を分岐する', () => {
		const absenceEvent: RankCalculationEvent = { kind: 'absent' };
		const flyingEvent: RankCalculationEvent = { kind: 'flying', timeSeconds: -0.1 };
		const participatedEvent: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 100,
			placement: 50,
			timeSeconds: 1,
			withinZoneParticipants: [],
		};

		const absenceStreak: RankStreakState = {
			consecutiveParticipationDays: 0,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 15,
			consecutiveFlyingCount: 0,
		};
		const flyingStreak: RankStreakState = {
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 3,
		};
		const participationStreak: RankStreakState = {
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};

		expect(
			calculatePenaltyPoints({
				rankNumber: 12,
				totalPoints: 1000,
				event: absenceEvent,
				isWithinZone: false,
				streak: absenceStreak,
			}),
		).toBe(300);
		expect(
			calculatePenaltyPoints({
				rankNumber: 12,
				totalPoints: 0,
				event: flyingEvent,
				isWithinZone: false,
				streak: flyingStreak,
			}),
		).toBe(140);
		expect(
			calculatePenaltyPoints({
				rankNumber: 12,
				totalPoints: 0,
				event: participatedEvent,
				isWithinZone: false,
				streak: participationStreak,
			}),
		).toBe(294);
	});
});
