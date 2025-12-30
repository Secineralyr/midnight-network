import { prisma } from '../../db';
import { getPreviousMatchDate } from './match';

/** ページあたりの件数 */
const PAGE_SIZE = 10;

/**
 * プライバシー設定を考慮したユーザー一覧を取得する（ランクPtランキング用）。
 * @returns ランクPtランキング用のユーザー一覧
 */
export function getLeaderboardRankUsers(): Promise<
	Array<{
		id: string;
		userName: string;
		userRankStatuses: { pt: number } | null;
		records: Array<{
			place: number;
			postedAt: Date;
			matchDate: { date: Date };
		}>;
	}>
> {
	return prisma.user.findMany({
		where: {
			banned: false,
			userSettings: {
				OR: [{ showLeaderboardRank: true }, { showLeaderboardRank: { equals: undefined } }],
			},
		},
		select: {
			id: true,
			userName: true,
			userRankStatuses: {
				select: { pt: true },
			},
			records: {
				select: {
					place: true,
					postedAt: true,
					matchDate: {
						select: { date: true },
					},
				},
			},
		},
	});
}

/**
 * プライバシー設定を考慮したユーザー一覧を取得する（ランキング全般用）。
 * @returns ランキング全般用のユーザー一覧
 */
export async function getLeaderboardRankingUsers(): Promise<
	Array<{
		id: string;
		userName: string;
		userRankStatuses: { pt: number } | null;
		records: Array<{
			place: number;
			postedAt: Date;
			matchDate: { date: Date };
		}>;
	}>
> {
	return await prisma.user.findMany({
		where: {
			banned: false,
			userSettings: {
				OR: [{ showLeaderboardRanking: true }, { showLeaderboardRanking: { equals: undefined } }],
			},
		},
		select: {
			id: true,
			userName: true,
			userRankStatuses: {
				select: { pt: true },
			},
			records: {
				select: {
					place: true,
					postedAt: true,
					matchDate: {
						select: { date: true },
					},
				},
			},
		},
	});
}

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
 * 前回のランキングにおける順位を取得する。
 * @param userId ユーザーID
 * @param currentMatchId 現在のMatchDateのID
 * @param rankingData ランキングデータ（ソート済み）
 * @returns 前回の順位（存在しない場合は0）
 */
export async function getPreviousPlace(
	userId: string,
	currentMatchId: number,
	_rankingData: Array<{ id: string; pt: number }>,
): Promise<number> {
	const previousMatch = await getPreviousMatchDate(currentMatchId);
	if (!previousMatch) {
		return 0;
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

	const userIndex = previousRankHistories.findIndex((h) => h.userId === userId);
	return userIndex >= 0 ? userIndex + 1 : 0;
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
