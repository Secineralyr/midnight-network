// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * TanStack Query クライアント設定
 */

import { QueryClient } from '@tanstack/svelte-query';

/**
 * クエリクライアントインスタンスを作成する
 * @returns QueryClient インスタンス
 */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5,
				gcTime: 1000 * 60 * 30,
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	});
}
