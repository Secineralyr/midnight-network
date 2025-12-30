import { createAuthClient } from './auth-client';
import { isMockAuthEnabled, setMockLoggedIn } from './mock-auth';
import { redirectToHome } from './navigation';

/**
 * ログアウトを実行してホームへ戻る。
 */
export async function startLogout(origin: string): Promise<void> {
	if (isMockAuthEnabled()) {
		setMockLoggedIn(false);
		redirectToHome(origin);
		return;
	}

	const authClient = createAuthClient();
	await authClient.signOut();
	redirectToHome(origin);
}
