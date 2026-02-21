// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * ホームへ遷移する。
 */
export function redirectToHome(origin: string): void {
	const url = new URL('/', origin).toString();
	window.location.assign(url);
}
