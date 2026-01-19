import { prisma } from '../../db';

/**
 * 投稿時間とマッチ日時の差分（秒）を計算する。
 * 負の値はフライングを意味する。
 * @param postedAt 投稿日時
 * @param matchDate マッチ日時
 * @returns 差分（秒）
 */
export function calculateTimeDifferenceSeconds(postedAt: Date, matchDate: Date): number {
	return (postedAt.getTime() - matchDate.getTime()) / 1000;
}

/**
 * フライングかどうかを判定する。
 * @param timeSeconds 投稿時間の差分（秒）
 * @returns フライングの場合true
 */
export function isFlying(timeSeconds: number): boolean {
	return timeSeconds < 0;
}

/**
 * 現在時刻以下の直近のMatchDateを取得する。
 * @returns MatchDate、存在しない場合はnull
 */
export async function getLatestMatchDate(): Promise<{
	id: number;
	date: Date;
	eventId: number | null;
} | null> {
	const now = new Date();
	const matchDate = await prisma.matchDate.findFirst({
		where: {
			date: {
				lte: now,
			},
		},
		orderBy: {
			date: 'desc',
		},
		select: {
			id: true,
			date: true,
			eventId: true,
		},
	});
	return matchDate;
}

/**
 * 前日のMatchDateを取得する。
 * @param currentMatchId 現在のMatchDateのID
 * @returns 前日のMatchDate、存在しない場合はnull
 */
export async function getPreviousMatchDate(currentMatchId: number): Promise<{
	id: number;
	date: Date;
} | null> {
	const currentMatch = await prisma.matchDate.findUnique({
		where: { id: currentMatchId },
		select: { date: true },
	});
	if (!currentMatch) {
		return null;
	}

	const previousMatch = await prisma.matchDate.findFirst({
		where: {
			date: {
				lt: currentMatch.date,
			},
		},
		orderBy: {
			date: 'desc',
		},
		select: {
			id: true,
			date: true,
		},
	});
	return previousMatch;
}
