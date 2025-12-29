import type {
	GetSettingsParamsT,
	GetSettingsResponseT,
	LastResultParamsT,
	LastResultResponseT,
	SetSettingsParamsT,
	SetSettingsResponseT,
} from '@midnight-network/shared/rpc/me/models';
import type { AuthContext } from '../../rpc';

export function lastResult(_ctx: AuthContext, _input: LastResultParamsT): LastResultResponseT {
	// TODO: ログインユーザーの最新リザルトを取得する
	// TODO: DBから取得する前に、KVのキャッシュがあればそれを返す。
	// TODO: DBから取得したなら、KVにキャッシュしておく、「プレフィクス: lastResult」「次の日のTARGET_MATCH_HOURとTARGET_MATCH_MINUTESまでを有効期限とする」
	return {};
}

export function getSettings(_ctx: AuthContext, _input: GetSettingsParamsT): GetSettingsResponseT {
	// TODO: 現在の設定状態を取得する
	return [];
}

export function setSettings(_ctx: AuthContext, _input: SetSettingsParamsT): SetSettingsResponseT {
	// TODO: 現在の設定状態を反映する
	return [];
}
