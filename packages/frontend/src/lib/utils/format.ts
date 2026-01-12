/**
 * フォーマット関連のユーティリティ関数
 */

/**
 * 数値を3桁区切りでフォーマットする
 * @param value - 数値
 * @returns フォーマットされた文字列
 */
export function formatNumber(value: number): string {
	return value.toLocaleString('ja-JP');
}

/**
 * 秒数を時間表示にフォーマットする
 * @param seconds - 秒数
 * @returns HH:MM:SS.mmm 形式の文字列
 */
export function formatTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 1000);

	const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');

	return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`;
}

/**
 * タイム差分をフォーマットする（+/-表示）
 * @param seconds - 秒数
 * @returns +X.XXXs 形式の文字列
 */
export function formatTimeDiff(seconds: number): string {
	const sign = seconds >= 0 ? '+' : '';
	return `${sign}${seconds.toFixed(3)}s`;
}

/**
 * ポイントをフォーマットする
 * @param pt - ポイント
 * @returns pt付きの文字列
 */
export function formatPt(pt: number): string {
	return `${formatNumber(pt)}pt`;
}

/**
 * 順位をフォーマットする
 * @param place - 順位
 * @returns #N 形式の文字列
 */
export function formatPlace(place: number): string {
	return `#${place}`;
}

/**
 * 順位の変動をフォーマットする
 * @param current - 現在の順位
 * @param previous - 前日の順位
 * @returns 変動表示文字列
 */
export function formatPlaceChange(current: number, previous: number): string {
	const diff = previous - current;
	if (diff > 0) {
		return `↑${diff}`;
	}
	if (diff < 0) {
		return `↓${Math.abs(diff)}`;
	}
	return '-';
}

/**
 * 日付をフォーマットする
 * @param date - Date オブジェクト
 * @returns YYYY/MM/DD 形式の文字列
 */
export function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}/${month}/${day}`;
}

/**
 * WR（勝率）をフォーマットする
 * @param wr - 勝率（0-1の小数）
 * @returns 小数3桁の文字列
 */
export function formatWinRate(wr: number): string {
	return (wr * 100).toFixed(3);
}

/**
 * 平均タイムをフォーマットする
 * @param avgTime - 平均タイム（秒）
 * @returns X.XXXs 形式の文字列
 */
export function formatAvgTime(avgTime: number): string {
	return `${(avgTime / 1000).toFixed(3)}s`;
}
