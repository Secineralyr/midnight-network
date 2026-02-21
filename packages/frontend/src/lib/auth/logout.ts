// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { createAuthClient } from './auth-client';
import { redirectToHome } from './navigation';

/**
 * ログアウトを実行してホームへ戻る。
 */
export async function startLogout(origin: string): Promise<void> {
	const authClient = createAuthClient();
	await authClient.signOut();
	redirectToHome(origin);
}
