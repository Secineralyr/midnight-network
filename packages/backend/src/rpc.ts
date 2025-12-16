import { contract } from '@midnight-network/shared/rpc';
import { implement } from '@orpc/server';

export type RpcContext = {
	headers: Headers;
	env?: unknown;
};

const base = implement(contract).$context<RpcContext>();

export const router = base.router({
	ping: base.ping.handler(async () => 'pong' as const),
	echo: base.echo.handler(async ({ input }) => ({ message: input.message })),
});
