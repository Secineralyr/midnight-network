import { os } from '@orpc/server';
import { z } from 'zod';

export type RpcContext = {
	headers: Headers;
	env?: unknown;
};

const base = os.$context<RpcContext>();

const ping = base.handler(async () => 'pong');

const echo = base
	.input(
		z.object({
			message: z.string().min(1),
		}),
	)
	.handler(async ({ input }) => ({ message: input.message }));

export const router = {
	ping,
	echo,
};

export type AppRouter = typeof router;
