import { MisskeyOAuthDefaultScopes, MisskeyOAuthProviderId } from '@midnight-network/shared/auth-misskey';
import { createAuthClient } from './auth-client';

/**
 * Misskey OAuthログインを開始する。
 */
export async function startMisskeyLogin(origin: string): Promise<void> {
	const callbackURL = new URL('/callback', origin).toString();
	const authClient = createAuthClient(origin);

	await authClient.signIn.oauth2({
		providerId: MisskeyOAuthProviderId,
		scopes: [...MisskeyOAuthDefaultScopes],
		callbackURL,
		newUserCallbackURL: callbackURL,
		errorCallbackURL: callbackURL,
	});
}
