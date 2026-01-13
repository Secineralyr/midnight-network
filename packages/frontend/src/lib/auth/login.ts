import { createAuthClient } from './auth-client';

/**
 * Misskey OAuthログインを開始する。
 */
export async function startMisskeyLogin(origin: string): Promise<void> {
	const callbackUrl = new URL('/callback', origin).toString();
	const authClient = createAuthClient();

	await authClient.signInWithMiauth({
		host: 'misskey.io',
		callbackUrl,
	});
}
