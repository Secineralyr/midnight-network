import type { RankCalculationEvent, RankStreakState } from '@midnight-network/shared/rank-status-system';

/**
 * イベント結果から、連続カウント(ストリーク)の次状態を計算します。
 *
 * - 参加: 連続参加日数を加算し、不参加日数をリセットします
 * - 圏内: 連続圏内日数を加算し、圏外ならリセットします
 * - 不参加: 連続未参加日数を加算し、参加/圏内/フライングをリセットします
 * - フライング: 参加扱いとして連続参加日数を加算し、連続フライング回数を加算します
 *
 * @param previousStreak 前回までのストリーク状態
 * @param event 今回のイベント結果
 * @param isWithinZone 今回が圏内かどうか(参加イベントのみ有効)
 */
export function calculateNextStreakState(
	previousStreak: RankStreakState,
	event: RankCalculationEvent,
	isWithinZone: boolean,
): RankStreakState {
	if (event.kind === 'absent') {
		return {
			consecutiveParticipationDays: 0,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: previousStreak.consecutiveAbsenceDays + 1,
			consecutiveFlyingCount: 0,
		};
	}

	if (event.kind === 'flying') {
		return {
			consecutiveParticipationDays: previousStreak.consecutiveParticipationDays + 1,
			consecutiveWithinZoneDays: 0,
			consecutiveAbsenceDays: 0,
			consecutiveFlyingCount: previousStreak.consecutiveFlyingCount + 1,
		};
	}

	return {
		consecutiveParticipationDays: previousStreak.consecutiveParticipationDays + 1,
		consecutiveWithinZoneDays: isWithinZone ? previousStreak.consecutiveWithinZoneDays + 1 : 0,
		consecutiveAbsenceDays: 0,
		consecutiveFlyingCount: 0,
	};
}
