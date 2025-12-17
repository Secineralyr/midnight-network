import type { AppClient } from '@midnight-network/shared/rpc';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const link = new RPCLink({
	url: () => {
		const configured = import.meta.env.VITE_BACKEND_RPC_URL;
		if (configured) {
			return configured;
		}
		return 'http://localhost:8787/api';
	},
});

export const orpc: AppClient = createORPCClient(link);
