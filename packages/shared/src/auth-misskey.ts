/**
 * BetterAuth(Generic OAuth)で使用するMisskeyのプロバイダーID。
 *
 * フロント/バックエンドの双方で同一文字列を参照できるよう、sharedパッケージに定義する。
 */
export const MisskeyOAuthProviderId = 'misskey' as const;

/**
 * `MisskeyOAuthProviderId` の型。
 */
export type MisskeyOAuthProviderId = typeof MisskeyOAuthProviderId;

/**
 * Misskey OAuthでユーザー情報取得に必要な最小スコープ。
 *
 * 必要に応じて `authClient.signIn.oauth2({ scopes })` 等で上書きする。
 */
export const MisskeyOAuthDefaultScopes = ['read:account'] as const;

/**
 * `MisskeyOAuthDefaultScopes` の要素型。
 */
export type MisskeyOAuthScope = (typeof MisskeyOAuthDefaultScopes)[number];
