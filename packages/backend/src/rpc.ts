import { contract } from '@midnight-network/shared/rpc';
import { implement, ORPCError } from '@orpc/server';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';
import { auth } from './auth';

export type RpcContext = RequestHeadersPluginContext & {
	env?: unknown;
};

const base = implement(contract).$context<RpcContext>();

const authedMiddleware = base.middleware(async ({ context, next }) => {
	const sessionData = context.reqHeaders
		? await auth.api.getSession({
				headers: context.reqHeaders,
			})
		: undefined;

	if (!(sessionData?.session && sessionData?.user)) {
		throw new ORPCError('UNAUTHORIZED');
	}

	return next({
		context: {
			session: sessionData.session,
			user: sessionData.user,
		},
	});
});

const authorized = base.use(authedMiddleware);

export const router = base.router({
	ping: base.ping.handler(async () => 'pong' as const),
	pingAuth: authorized.pingAuth.handler(async () => 'pong' as const),
	echo: base.echo.handler(async ({ input }) => ({ message: input.message })),
});
