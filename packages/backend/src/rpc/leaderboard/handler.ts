import type {
	AvgTimeParamsT,
	AvgTimeResponseT,
	MatchTimeParamsT,
	MatchTimeResponseT,
	RankHistParamsT,
	RankHistResponseT,
	RankParamsT,
	RankResponseT,
	WrParamsT,
	WrResponseT,
} from '@midnight-network/shared/rpc/leaderboard/models';

export function averageTime(_input: AvgTimeParamsT): AvgTimeResponseT {
	// TODO: 平均タイムのランキングを取得する
	// TODO: 1度で取得できるのは10件まで、inputをoffsetとする(1始まり)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowLeaderboardRankingがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: averageTime」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function matchTime(_input: MatchTimeParamsT): MatchTimeResponseT {
	// TODO: 試合のタイムのランキングを取得する
	// TODO: 1度で取得できるのは10件まで、inputをoffsetとする(1始まり)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowLeaderboardRankingがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: matchTime」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function rank(_input: RankParamsT): RankResponseT {
	// TODO: ランクptのランキングを取得する
	// TODO: 1度で取得できるのは10件まで、inputをoffsetとする(1始まり)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowLeaderboardRankがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: rank」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function rankHistogram(_input: RankHistParamsT): RankHistResponseT {
	// TODO: 各ランクにおいて全体がどれだけいるかをパーセントで返す
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: rankHistogram」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}

export function wr(_input: WrParamsT): WrResponseT {
	// TODO: WR(優勝レート)のランキングを取得する
	// TODO: 1度で取得できるのは10件まで、inputをoffsetとする(1始まり)
	// TODO: ログインユーザーが自身ではなくそのユーザーのshowLeaderboardRankingがfalseであれば入れない
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: wr」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return [];
}
