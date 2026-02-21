// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { BorderProtectionState } from '@midnight-network/shared/rank-status-system';
import { describe, expect, it } from 'vitest';

import { applyBorderProtection, calculateBorderProtectionCooldownDays } from './border-protection.js';

describe('プロテクトクールタイムの計算', () => {
	it('ランクに応じた日数を返す', () => {
		expect(calculateBorderProtectionCooldownDays(0)).toBe(5);
		expect(calculateBorderProtectionCooldownDays(6)).toBe(10);
		expect(calculateBorderProtectionCooldownDays(12)).toBe(15);
	});
});

describe('ボーダープロテクトの適用', () => {
	it('降格時かつクールタイム0なら消費し、クールタイムが加算される', () => {
		const previousBorderProtection: BorderProtectionState = { cooldownDays: 0 };

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
			nextBorderProtection: { cooldownDays: 13 },
			usedBorderProtection: true,
		});
	});

	it('クールタイムが残っている場合は消費しない', () => {
		const previousBorderProtection: BorderProtectionState = { cooldownDays: 3 };

		expect(
			applyBorderProtection({
				currentRankNumber: 12,
				provisionalNextRankNumber: 11,
				provisionalNextTotalPoints: 5400,
				isParticipating: true,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 5400,
			nextBorderProtection: { cooldownDays: 3 },
			usedBorderProtection: false,
		});
	});

	it('不参加の場合は消費せずクールタイムを維持する', () => {
		const previousBorderProtection: BorderProtectionState = { cooldownDays: 0 };

		expect(
			applyBorderProtection({
				currentRankNumber: 12,
				provisionalNextRankNumber: 11,
				provisionalNextTotalPoints: 5400,
				isParticipating: false,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 5400,
			nextBorderProtection: { cooldownDays: 0 },
			usedBorderProtection: false,
		});
	});

	it('不参加の場合にクールタイムが1減算されない', () => {
		const previousBorderProtection: BorderProtectionState = { cooldownDays: 2 };

		expect(
			applyBorderProtection({
				currentRankNumber: 10,
				provisionalNextRankNumber: 10,
				provisionalNextTotalPoints: 5200,
				isParticipating: false,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 5200,
			nextBorderProtection: { cooldownDays: 2 },
			usedBorderProtection: false,
		});
	});

	it('降格時ではない場合にクールタイムが1減算される', () => {
		const previousBorderProtection: BorderProtectionState = { cooldownDays: 2 };

		expect(
			applyBorderProtection({
				currentRankNumber: 10,
				provisionalNextRankNumber: 10,
				provisionalNextTotalPoints: 5200,
				isParticipating: true,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 5200,
			nextBorderProtection: { cooldownDays: 1 },
			usedBorderProtection: false,
		});
	});

	it('降格時ではない場合にクールタイムが0なら減算されない', () => {
		const previousBorderProtection: BorderProtectionState = { cooldownDays: 0 };

		expect(
			applyBorderProtection({
				currentRankNumber: 10,
				provisionalNextRankNumber: 10,
				provisionalNextTotalPoints: 5200,
				isParticipating: true,
				previousBorderProtection,
			}),
		).toEqual({
			nextTotalPoints: 5200,
			nextBorderProtection: { cooldownDays: 0 },
			usedBorderProtection: false,
		});
	});
});
