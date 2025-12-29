import type {
	EarnedPtParamsT,
	EarnedPtResponseT,
	HeatmapParamsT,
	HeatmapResponseT,
	PostTimeParamsT,
	PostTimeResponseT,
	RadarParamsT,
	RadarResponseT,
	TotalPtParamsT,
	TotalPtResponseT,
	UserParamsT,
	UserResponseT,
} from '@midnight-network/shared/rpc/user/models';

export function profile(_input: UserParamsT): UserResponseT {
	// TODO: userIdからユーザー情報を取得する。存在しないユーザーはundefinedを返す。
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileStatsがfalseであればundefinedを返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: profile」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function earnedPtChart(_input: EarnedPtParamsT): EarnedPtResponseT {
	// TODO: グラフスパンに合わせたuserIdから獲得ptを取得する (Dailyは最長1ヶ月、Weaklyは最長半年、Monthlyは最長1年)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileStatsがfalseであればエラーを返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: earnedPtChart」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function heatmapChart(_input: HeatmapParamsT): HeatmapResponseT {
	// TODO: userIdから試合結果ヒートマップを取得する(最長30日)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileStatsがfalseであればエラーを返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: heatmapChart」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function postTimeChart(_input: PostTimeParamsT): PostTimeResponseT {
	// TODO: グラフスパンに合わせたuserIdから試合ごとの投稿時間を取得する (Dailyは最長1ヶ月、Weaklyは最長半年、Monthlyは最長1年)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileStatsがfalseであればエラーを返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: postTimeChart」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function radarChart(_input: RadarParamsT): RadarResponseT {
	// TODO: userIdから各値を「全体平均」を50%とした比較値を取得する
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileStatsがfalseであればエラーを返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: radarChart」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export async function totalPtChart(_input: TotalPtParamsT): Promise<TotalPtResponseT> {
	// TODO: グラフスパンに合わせたuserIdから累計Ptを取得する (Dailyは最長1ヶ月、Weaklyは最長半年、Monthlyは最長1年)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileStatsがfalseであればエラーを返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: totalPtChart」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}
