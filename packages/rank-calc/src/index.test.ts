import type { RankCalculationEvent, RankProgressState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { calculateRankUpdate } from './index.js';

describe('ランク更新の計算', () => {
	it('5回目の参加でノーランク解除（Ø判定）になる', () => {
		const state: RankProgressState = {
			totalPoints: 0,
			totalParticipationCount: 4,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { cooldownDays: 0 },
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 10,
			placement: 1,
			timeSeconds: 1,
			withinZoneParticipants: [],
		};

		const result = calculateRankUpdate(state, event);
		expect(result.pointDelta).toBe(40);
		expect(result.nextTotalPoints).toBe(40);
		expect(result.nextTotalParticipationCount).toBe(5);
		expect(result.nextIsNoRank).toBe(false);
		expect(result.nextRankNumber).toBe(0);
	});

	it('ストリーク更新後の値でボーナス計算される（2日目の連続参加ボーナス）', () => {
		const state: RankProgressState = {
			totalPoints: 1,
			totalParticipationCount: 5,
			streak: {
				consecutiveParticipationDays: 1,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { cooldownDays: 0 },
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 1,
			placement: 1,
			timeSeconds: 1,
			withinZoneParticipants: [],
		};

		const result = calculateRankUpdate(state, event);
		expect(result.pointDelta).toBe(41);
		expect(result.nextStreak.consecutiveParticipationDays).toBe(2);
	});

	it('参加により降格が発生する場合はボーダープロテクトを消費する', () => {
		const state: RankProgressState = {
			totalPoints: 5000,
			totalParticipationCount: 10,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 3,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { cooldownDays: 0 },
		};
		const event: RankCalculationEvent = {
			kind: 'participated',
			participantCount: 100,
			placement: 100,
			timeSeconds: 1,
			withinZoneParticipants: [
				{ placement: 1, rankNumber: 12 },
				{ placement: 10, rankNumber: 12 },
			],
		};

		const result = calculateRankUpdate(state, event);
		expect(result.pointDelta).toBe(-182);
		expect(result.usedBorderProtection).toBe(true);
		expect(result.nextTotalPoints).toBe(5000);
		expect(result.nextRankNumber).toBe(10);
		expect(result.nextBorderProtection).toEqual({ cooldownDays: 13 });
		expect(result.nextStreak.consecutiveWithinZoneDays).toBe(0);
	});
});
