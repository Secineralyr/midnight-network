import type {
	RankTopParamsT,
	RankTopResponseT,
	SearchUserParamsT,
	SearchUserResponseT,
	TodayTopParamsT,
	TodayTopResponseT,
} from '@midnight-network/shared/rpc/models';

export function searchUser(_input: SearchUserParamsT): SearchUserResponseT {
	// TODO: 渡されたクエリを含むユーザー名を検索する
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowProfileSearchがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: searchUser」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function todayTop(_input: TodayTopParamsT): TodayTopResponseT {
	// TODO: 本日の試合におけるトップ3ユーザーの結果を返す
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowLeaderboardRankingがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: todayTop」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function rankTop(_input: RankTopParamsT): RankTopResponseT {
	// TODO: ランクトップ3ユーザーの結果を返す
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowLeaderboardRankがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: rankTop」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}
