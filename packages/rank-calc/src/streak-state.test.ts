// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RankCalculationEvent, RankStreakState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { calculateNextStreakState } from './streak-state.js';

const initialStreak: RankStreakState = {
	consecutiveParticipationDays: 0,
	consecutiveWithinZoneDays: 0,
	consecutiveAbsenceDays: 0,
	consecutiveFlyingCount: 0,
};

describe('ストリーク状態の更新', () => {
	it('不参加で連続未参加日数が増える', () => {
		const event: RankCalculationEvent = { kind: 'absent' };
		expect(calculateNextStreakState(initialStreak, event, false)).toEqual({
			consecutiveParticipationDays: 0,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 1,
			consecutiveFlyingCount: 0,
		});
	});

	it('参加（圏内）で連続参加/連続圏内が増える', () => {
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 10,
			placement: 1,
			timeSeconds: 1,
			withinZoneParticipants: [],
		};
		expect(calculateNextStreakState(initialStreak, event, true)).toEqual({
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 1,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		});
	});

	it('参加（圏外）で連続圏内がリセットされる', () => {
		const previous: RankStreakState = { ...initialStreak, consecutiveParticipationDays: 3, consecutiveWithinZoneDays: 2 };
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 10,
			placement: 20,
			timeSeconds: 1,
			withinZoneParticipants: [],
		};
		expect(calculateNextStreakState(previous, event, false)).toEqual({
			consecutiveParticipationDays: 4,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		});
	});

	it('フライングで連続フライング回数が増える', () => {
		const event: RankCalculationEvent = { kind: 'flying', timeSeconds: -0.01 };
		expect(calculateNextStreakState(initialStreak, event, false)).toEqual({
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 1,
		});
	});
});
