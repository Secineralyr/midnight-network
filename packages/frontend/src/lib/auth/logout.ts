import { createAuthClient } from './auth-client';
import { redirectToHome } from './navigation';

/**
 * ログアウトを実行してホームへ戻る。
 */
export async function startLogout(origin: string): Promise<void> {
	const authClient = createAuthClient(origin);
	await authClient.signOut();
	redirectToHome(origin);
}
