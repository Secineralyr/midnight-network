import type { AppRouter } from '@midnight-network/shared/rpc';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';

const link = new RPCLink({
	url: () => {
		const configured = import.meta.env.VITE_BACKEND_RPC_URL;
		if (configured) {
			return configured;
		}
		if (typeof window !== 'undefined') {
			return `${window.location.origin}/rpc`;
		}
		return 'http://localhost:8787/rpc';
	},
});

export const orpc: RouterClient<AppRouter> = createORPCClient(link);
