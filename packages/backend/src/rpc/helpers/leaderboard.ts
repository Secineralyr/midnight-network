import { prisma } from '../../db';
import { getPreviousMatchDate } from './match';

/** ページあたりの件数 */
const PAGE_SIZE = 10;

/**
 * ランキングのページング情報を計算する。
 * @param totalCount 総件数
 * @param offset オフセット（1始まり）
 * @returns ページング情報
 */
export function calculatePagination(
	totalCount: number,
	offset: number,
): {
	currentOffset: number;
	maxOffset: number;
	skip: number;
	take: number;
} {
	const maxOffset = Math.ceil(totalCount / PAGE_SIZE);
	const currentOffset = Math.min(Math.max(1, offset), maxOffset || 1);
	const skip = (currentOffset - 1) * PAGE_SIZE;

	return {
		currentOffset,
		maxOffset,
		skip,
		take: PAGE_SIZE,
	};
}

/**
 * 全ユーザーの前回順位マップを取得する。
 * @param currentMatchId 現在のMatchDateのID
 * @returns ユーザーIDと前回順位のマップ
 */
export async function getPreviousPlaceMap(currentMatchId: number): Promise<Map<string, number>> {
	const previousMatch = await getPreviousMatchDate(currentMatchId);
	if (!previousMatch) {
		return new Map();
	}

	const previousRankHistories = await prisma.userRankHistory.findMany({
		where: {
			matchId: previousMatch.id,
		},
		select: {
			userId: true,
			pt: true,
		},
		orderBy: {
			pt: 'desc',
		},
	});

	const placeMap = new Map<string, number>();
	previousRankHistories.forEach((h, index) => {
		placeMap.set(h.userId, index + 1);
	});

	return placeMap;
}
