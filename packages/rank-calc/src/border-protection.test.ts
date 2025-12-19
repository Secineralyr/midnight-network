import type { BorderProtectionState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { applyBorderProtection, calculateRequiredParticipationsForProtectionRecovery } from './border-protection.js';

describe('プロテクト回復に必要な参加回数の計算', () => {
	it('正規化ランクに応じた必要参加回数を返す', () => {
		expect(calculateRequiredParticipationsForProtectionRecovery(0)).toBe(5);
		expect(calculateRequiredParticipationsForProtectionRecovery(6)).toBe(10);
		expect(calculateRequiredParticipationsForProtectionRecovery(12)).toBe(15);
	});
});

describe('ボーダープロテクトの適用', () => {
	it('降格時にプロテクトを消費してボーダーポイントへ戻す', () => {
		const previousBorderProtection: BorderProtectionState = { isAvailable: true, participationCountSinceUse: 0 };

		expect(
			applyBorderProtection({
				currentRankNumber: 10,
				provisionalNextRankNumber: 9,
				provisionalNextTotalPoints: 4900,
				isParticipating: true,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 5000,
			nextBorderProtection: { isAvailable: false, participationCountSinceUse: 0 },
			usedBorderProtection: true,
		});
	});

	it('必要参加回数を満たすとプロテクトが回復する', () => {
		const previousBorderProtection: BorderProtectionState = { isAvailable: false, participationCountSinceUse: 14 };

		expect(
			applyBorderProtection({
				currentRankNumber: 12,
				provisionalNextRankNumber: 12,
				provisionalNextTotalPoints: 6000,
				isParticipating: true,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 6000,
			nextBorderProtection: { isAvailable: true, participationCountSinceUse: 0 },
			usedBorderProtection: false,
		});
	});

	it('不参加では回復の進捗を進めない', () => {
		const previousBorderProtection: BorderProtectionState = { isAvailable: false, participationCountSinceUse: 1 };

		expect(
			applyBorderProtection({
				currentRankNumber: 12,
				provisionalNextRankNumber: 12,
				provisionalNextTotalPoints: 6000,
				isParticipating: false,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 6000,
			nextBorderProtection: { isAvailable: false, participationCountSinceUse: 1 },
			usedBorderProtection: false,
		});
	});

	it('すでに回復済みなら利用可能のまま進捗をリセットする', () => {
		const previousBorderProtection: BorderProtectionState = { isAvailable: true, participationCountSinceUse: 999 };

		expect(
			applyBorderProtection({
				currentRankNumber: 12,
				provisionalNextRankNumber: 12,
				provisionalNextTotalPoints: 6100,
				isParticipating: true,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 6100,
			nextBorderProtection: { isAvailable: true, participationCountSinceUse: 0 },
			usedBorderProtection: false,
		});
	});
});
