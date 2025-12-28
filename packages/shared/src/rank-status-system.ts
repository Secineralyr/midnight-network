/**
 * ランクステータスシステムで使用する共通データモデルと定数。
 */

/**
 * ランク番号の候補(0〜12)。
 */
export const rankNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/**
 * ランク番号。
 *
 * - 0 は「Ø」を表す
 * - 12 は「Ⅰ」を表す
 * - 「No Rank」はランクではないため、別途 `isNoRank` などのフラグで表す
 */
export type RankNumber = (typeof rankNumbers)[number];

/**
 * ランク番号の最大値。
 */
export const maximumRankNumber = 12 as const;

/**
 * ランクのボーダーポイント(下限)。
 *
 * - 0pt は「No Rank」扱い(ランクではない)
 * - 1pt 以上で「Ø」(rankNumber=0)扱い
 */
export const rankPointThresholds = [
	{ rankNumber: 12, minimumPoints: 6000 },
	{ rankNumber: 11, minimumPoints: 5500 },
	{ rankNumber: 10, minimumPoints: 5000 },
	{ rankNumber: 9, minimumPoints: 4500 },
	{ rankNumber: 8, minimumPoints: 4000 },
	{ rankNumber: 7, minimumPoints: 3500 },
	{ rankNumber: 6, minimumPoints: 3000 },
	{ rankNumber: 5, minimumPoints: 2500 },
	{ rankNumber: 4, minimumPoints: 2000 },
	{ rankNumber: 3, minimumPoints: 1500 },
	{ rankNumber: 2, minimumPoints: 1000 },
	{ rankNumber: 1, minimumPoints: 500 },
	{ rankNumber: 0, minimumPoints: 1 },
] as const satisfies readonly { rankNumber: RankNumber; minimumPoints: number }[];

/**
 * ノーランク扱いとなる総ポイントの値。
 */
export const noRankPoints = 0 as const;

/**
 * 圏内プレイヤーの順位とランクのスナップショット。
 */
export type WithinZoneRankSnapshot = {
	/**
	 * 順位(1始まり)。
	 */
	placement: number;
	/**
	 * ランク番号(0=Ø, 12=Ⅰ)。
	 */
	rankNumber: RankNumber;
};

/**
 * 連続カウント(ストリーク)の状態。
 */
export type RankStreakState = {
	/**
	 * 連続参加日数。
	 */
	consecutiveParticipationDays: number;
	/**
	 * 連続圏内日数。
	 */
	consecutiveWithinZoneDays: number;
	/**
	 * 連続未参加日数。
	 */
	consecutiveAbsenceDays: number;
	/**
	 * 連続フライング回数。
	 */
	consecutiveFlyingCount: number;
};

/**
 * ボーダープロテクトの状態。
 */
export type BorderProtectionState = {
	/**
	 * プロテクトのクールタイム(日数)。
	 *
	 * 0 以下の場合はプロテクトが利用可能。
	 */
	cooldownDays: number;
};

/**
 * ランク計算に必要な進行状態。
 */
export type RankProgressState = {
	/**
	 * 総ポイント(今回加算前)。
	 */
	totalPoints: number;
	/**
	 * 総参加回数。
	 */
	totalParticipationCount: number;
	/**
	 * ストリーク状態。
	 */
	streak: RankStreakState;
	/**
	 * ボーダープロテクト状態。
	 */
	borderProtection: BorderProtectionState;
};

/**
 * ランク計算に渡す1イベント分の入力(不参加)。
 */
export type RankCalculationAbsentEvent = {
	/**
	 * イベント種別: 不参加。
	 */
	kind: 'absent';
	/**
	 * イベント倍率(未指定なら1)。
	 */
	eventMultiplier?: number;
};

/**
 * ランク計算に渡す1イベント分の入力(フライング)。
 */
export type RankCalculationFlyingEvent = {
	/**
	 * イベント種別: フライング。
	 */
	kind: 'flying';
	/**
	 * 自タイム(s)。
	 *
	 * -0.050s〜0.000s 未満の場合はフライング倍率が 0.5 になる。
	 */
	timeSeconds: number;
	/**
	 * イベント倍率(未指定なら1)。
	 */
	eventMultiplier?: number;
};

/**
 * ランク計算に渡す1イベント分の入力(参加)。
 */
export type RankCalculationParticipatedEvent = {
	/**
	 * イベント種別: 参加。
	 */
	kind: 'participated';
	/**
	 * 参加人数(フライング除外)。
	 */
	participantCount: number;
	/**
	 * 自順位。
	 */
	placement: number;
	/**
	 * 自タイム(s)。
	 */
	timeSeconds: number;
	/**
	 * 圏内プレイヤーの順位とランク。
	 *
	 * アップセットボーナス計算の対象は「圏内に入っているプレイヤー」のみ。
	 */
	withinZoneParticipants: readonly WithinZoneRankSnapshot[];
	/**
	 * イベント倍率(未指定なら1)。
	 */
	eventMultiplier?: number;
};

/**
 * ランク計算に渡す1イベント分の入力。
 *
 * - `eventMultiplier` は獲得ポイントにのみ乗算される(ペナルティには乗らない)
 */
export type RankCalculationEvent = RankCalculationAbsentEvent | RankCalculationFlyingEvent | RankCalculationParticipatedEvent;

/**
 * ランク計算結果(次状態)。
 */
export type RankCalculationResult = {
	/**
	 * 最終加算ポイント(丸め・上限下限適用済み)。
	 */
	pointDelta: number;
	/**
	 * 次の総ポイント。
	 */
	nextTotalPoints: number;
	/**
	 * 次のランク番号。
	 */
	nextRankNumber: RankNumber;
	/**
	 * 次がノーランク状態かどうか。
	 */
	nextIsNoRank: boolean;
	/**
	 * 次の総参加回数。
	 */
	nextTotalParticipationCount: number;
	/**
	 * 次のストリーク状態。
	 */
	nextStreak: RankStreakState;
	/**
	 * 次のボーダープロテクト状態。
	 */
	nextBorderProtection: BorderProtectionState;
	/**
	 * 今回プロテクトを消費したかどうか。
	 */
	usedBorderProtection: boolean;
};
