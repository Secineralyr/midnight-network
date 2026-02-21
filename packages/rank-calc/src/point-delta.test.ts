// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { RankCalculationEvent, RankStreakState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { calculatePointDelta } from './point-delta.js';

describe('最終加算ポイントの計算', () => {
	it('参加時の基本的な加算を計算する（ランク0）', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 10,
			placement: 1,
			timeSeconds: 1,
			withinZoneParticipants: [],
		};

		expect(calculatePointDelta({ rankNumber: 0, totalPoints: 0, event, isWithinZone: false, streak })).toBe(40);
	});

	it('イベント倍率は獲得ポイントにのみ乗る', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 10,
			placement: 1,
			timeSeconds: 1,
			withinZoneParticipants: [],
			eventMultiplier: 2,
		};

		expect(calculatePointDelta({ rankNumber: 0, totalPoints: 0, event, isWithinZone: false, streak })).toBe(80);
	});

	it('最大上昇値でクランプされる', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 2,
			consecutiveWithinZoneDays: 2,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 100,
			placement: 1,
			timeSeconds: 0,
			withinZoneParticipants: [],
			eventMultiplier: 10,
		};

		expect(calculatePointDelta({ rankNumber: 12, totalPoints: 6000, event, isWithinZone: true, streak })).toBe(500);
	});

	it('不参加ペナルティが大きい場合は最大降下値でクランプされる', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 0,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 15,
			consecutiveFlyingCount: 0,
		};
		const event: RankCalculationEvent = { kind: 'absent' };

		expect(calculatePointDelta({ rankNumber: 12, totalPoints: 100000, event, isWithinZone: false, streak })).toBe(-1000);
	});

	it('クランプ後に四捨五入される', () => {
		const streak: RankStreakState = {
			consecutiveParticipationDays: 1,
			consecutiveWithinZoneDays: 1,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: 0,
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 1,
			placement: 1,
			timeSeconds: 1,
			withinZoneParticipants: [{ placement: 1, rankNumber: 11 }],
		};

		expect(calculatePointDelta({ rankNumber: 11, totalPoints: 5500, event, isWithinZone: true, streak })).toBe(55);
	});
});
