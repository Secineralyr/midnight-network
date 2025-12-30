import { prisma } from '../../db';

/**
 * ユーザーの設定を取得する。
 * @param userId ユーザーID
 * @returns ユーザー設定、存在しない場合はデフォルト値
 */
export async function getUserSettings(userId: string): Promise<{
	showLeaderboardRank: boolean;
	showLeaderboardRanking: boolean;
	showProfileStats: boolean;
	showProfileSearch: boolean;
}> {
	const settings = await prisma.userSettings.findUnique({
		where: { id: userId },
		select: {
			showLeaderboardRank: true,
			showLeaderboardRanking: true,
			showProfileStats: true,
			showProfileSearch: true,
		},
	});

	return (
		settings ?? {
			showLeaderboardRank: true,
			showLeaderboardRanking: true,
			showProfileStats: true,
			showProfileSearch: true,
		}
	);
}

/**
 * ログインユーザーが対象ユーザーのプロフィール統計を閲覧できるかチェックする。
 * @param targetUserId 対象ユーザーID
 * @param loginUserId ログインユーザーID（未ログインの場合undefined）
 * @returns 閲覧可能な場合true
 */
export async function canViewProfileStats(targetUserId: string, loginUserId?: string): Promise<boolean> {
	if (loginUserId === targetUserId) {
		return true;
	}

	const settings = await getUserSettings(targetUserId);
	return settings.showProfileStats;
}

/**
 * ログインユーザーが対象ユーザーをプロフィール検索で見つけられるかチェックする。
 * @param targetUserId 対象ユーザーID
 * @param loginUserId ログインユーザーID（未ログインの場合undefined）
 * @returns 検索結果に含められる場合true
 */
export async function canSearchProfile(targetUserId: string, loginUserId?: string): Promise<boolean> {
	if (loginUserId === targetUserId) {
		return true;
	}

	const settings = await getUserSettings(targetUserId);
	return settings.showProfileSearch;
}

/**
 * ユーザーがランキング（ランクPt）に表示されるかチェックする。
 * @param targetUserId 対象ユーザーID
 * @param loginUserId ログインユーザーID（未ログインの場合undefined）
 * @returns ランキングに表示される場合true
 */
export async function canShowInLeaderboardRank(targetUserId: string, loginUserId?: string): Promise<boolean> {
	if (loginUserId === targetUserId) {
		return true;
	}

	const settings = await getUserSettings(targetUserId);
	return settings.showLeaderboardRank;
}

/**
 * ユーザーがランキング全般に表示されるかチェックする。
 * @param targetUserId 対象ユーザーID
 * @param loginUserId ログインユーザーID（未ログインの場合undefined）
 * @returns ランキングに表示される場合true
 */
export async function canShowInLeaderboardRanking(targetUserId: string, loginUserId?: string): Promise<boolean> {
	if (loginUserId === targetUserId) {
		return true;
	}

	const settings = await getUserSettings(targetUserId);
	return settings.showLeaderboardRanking;
}
