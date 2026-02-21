// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * ランク関連のユーティリティ関数
 */

import { RankText, RankType } from '@midnight-network/shared/rank';
import { rankPointThresholds } from '@midnight-network/shared/rank-status-system';

/** ランクタイプの値型 */
export type RankTypeValue = (typeof RankType)[keyof typeof RankType];

/**
 * ランクの数値からランク名を取得する
 * @param rankValue - ランクの数値
 * @returns ランク名
 */
export function getRankName(rankValue: RankTypeValue): string {
	const entries = Object.entries(RankType) as [keyof typeof RankType, RankTypeValue][];
	const found = entries.find(([, value]) => value === rankValue);
	return found ? found[0] : 'NoRank';
}

/**
 * ランクの数値から表示テキストを取得する
 * @param rankValue - ランクの数値
 * @returns ランク表示テキスト
 */
export function getRankText(rankValue: RankTypeValue): string {
	const name = getRankName(rankValue) as keyof typeof RankText;
	return RankText[name] || RankText.NoRank;
}

/**
 * ランクのグレード（色分け用カテゴリ）を取得する
 * @param rankValue - ランクの数値
 * @returns グレード名
 */
export function getRankGrade(
	rankValue: RankTypeValue,
): 'tachyon' | 'luminal' | 'gold' | 'silver' | 'bronze' | 'normal' | 'beginner' | 'norank' {
	if (rankValue === RankType.Tachyon) {
		return 'tachyon';
	}
	if (rankValue === RankType.LuminalBefore || rankValue === RankType.LuminalAfter) {
		return 'luminal';
	}
	if (rankValue === RankType.GoldBefore || rankValue === RankType.GoldAfter) {
		return 'gold';
	}
	if (rankValue === RankType.SilverBefore || rankValue === RankType.SilverAfter) {
		return 'silver';
	}
	if (rankValue === RankType.BronzeBefore || rankValue === RankType.BronzeAfter) {
		return 'bronze';
	}
	if (rankValue === RankType.NormalBefore || rankValue === RankType.NormalAfter) {
		return 'normal';
	}
	if (rankValue === RankType.BeginnerBefore || rankValue === RankType.BeginnerAfter) {
		return 'beginner';
	}
	return 'norank';
}

/**
 * ランクのCSSクラス名を取得する
 * @param rankValue - ランクの数値
 * @returns CSSクラス名
 */
export function getRankClassName(rankValue: RankTypeValue): string {
	return `rank-${getRankGrade(rankValue)}`;
}

/**
 * ランクアイコンのパスを取得する
 * @param rankValue - ランクの数値
 * @returns アイコンパス
 */
export function getRankIconPath(rankValue: RankTypeValue): string {
	return `/rank/time/${rankValue}.png`;
}

/**
 * ランクバッジのパスを取得する
 * @param rankValue - ランクの数値
 * @returns バッジパス
 */
export function getRankBadgePath(rankValue: RankTypeValue): string {
	return `/rank/budge/${rankValue}.png`;
}

/**
 * ptからランク番号を取得する
 * @param pt - 累計pt
 * @returns ランク番号（-1=NoRank, 0-12）
 */
export function getRankFromPt(pt: number): RankTypeValue {
	if (pt <= 0) {
		return RankType.NoRank;
	}

	for (const threshold of rankPointThresholds) {
		if (pt >= threshold.minimumPoints) {
			return threshold.rankNumber as RankTypeValue;
		}
	}

	return RankType.NoRank;
}
