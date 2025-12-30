import { MisskeyOAuthDefaultScopes, MisskeyOAuthProviderId } from '@midnight-network/shared/auth-misskey';
import { createAuthClient } from './auth-client';
import { isMockAuthEnabled, setMockLoggedIn } from './mock-auth';
import { redirectToHome } from './navigation';

/**
 * Misskey OAuthログインを開始する。
 */
export async function startMisskeyLogin(origin: string): Promise<void> {
	if (isMockAuthEnabled()) {
		setMockLoggedIn(true);
		redirectToHome(origin);
		return;
	}

	const callbackURL = new URL('/callback', origin).toString();
	const authClient = createAuthClient();

	await authClient.signIn.oauth2({
		providerId: MisskeyOAuthProviderId,
		scopes: [...MisskeyOAuthDefaultScopes],
		callbackURL,
		newUserCallbackURL: callbackURL,
		errorCallbackURL: callbackURL,
	});
}
