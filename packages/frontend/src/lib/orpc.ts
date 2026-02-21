// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { AppClient } from '@midnight-network/shared/rpc';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const link = new RPCLink({
	url: () => `${import.meta.env.VITE_API_ROOT}/api`,
	fetch: (request, init) =>
		fetch(request, {
			...init,
			credentials: 'include',
		}),
});

export const orpc: AppClient = createORPCClient(link);
