import type { RankProgressState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { applyUpdateRankReset } from './update-rank-reset.js';

describe('アップデート時ランクリセットの適用', () => {
	it('ノーランクの場合は状態を変更しない', () => {
		const state: RankProgressState = {
			totalPoints: 0,
			totalParticipationCount: 4,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { isAvailable: true, participationCountSinceUse: 0 },
		};

		expect(applyUpdateRankReset(state)).toBe(state);
	});

	it('上位ランクはカットし、カット後ランクのボーダーポイントへ丸める', () => {
		const state: RankProgressState = {
			totalPoints: 6500,
			totalParticipationCount: 10,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { isAvailable: true, participationCountSinceUse: 0 },
		};

		expect(applyUpdateRankReset(state).totalPoints).toBe(5500);
	});

	it('ØとⅫはポイントを変更しない', () => {
		const beginnerState: RankProgressState = {
			totalPoints: 200,
			totalParticipationCount: 10,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { isAvailable: true, participationCountSinceUse: 0 },
		};
		const rankTwelveState: RankProgressState = {
			totalPoints: 700,
			totalParticipationCount: 10,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { isAvailable: true, participationCountSinceUse: 0 },
		};

		expect(applyUpdateRankReset(beginnerState).totalPoints).toBe(200);
		expect(applyUpdateRankReset(rankTwelveState).totalPoints).toBe(700);
	});

	it('同ランクでもボーダーポイントへ丸める（例: Ⅺ）', () => {
		const state: RankProgressState = {
			totalPoints: 1400,
			totalParticipationCount: 10,
			streak: {
				consecutiveParticipationDays: 0,
				consecutiveWithinZoneDays: 0,
				consecutiveAbsenceDays: 0,
				consecutiveFlyingCount: 0,
			},
			borderProtection: { isAvailable: true, participationCountSinceUse: 0 },
		};

		expect(applyUpdateRankReset(state).totalPoints).toBe(1000);
	});
});
