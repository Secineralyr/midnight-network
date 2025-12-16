import { router } from '@midnight-network/shared/rpc';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';

type Env = {
	DB: D1Database;
	SESSION_KV: KVNamespace;
};

const rpc = new RPCHandler(router, {
	plugins: [
		new CORSPlugin({
			origin: ['http://localhost:5173'],
			credentials: true,
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const app = new Elysia({
	adapter: CloudflareAdapter,
})
	.get('/health', () => ({ ok: true }))
	.post('/webhook/example', async ({ request }) => {
		const body = await request.text();
		console.info('webhook/example', body);
		return new Response(null, { status: 204 });
	})
	.all(
		'/rpc*',
		async ({ request }) => {
			const { response } = await rpc.handle(request, {
				prefix: '/rpc',
				context: {
					headers: request.headers,
				},
			});

			return response ?? new Response('Not Found', { status: 404 });
		},
		{
			parse: 'none',
		},
	);

export default {
	fetch: app.fetch,
	scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		console.info('cron', event.cron);
		ctx.waitUntil(env.SESSION_KV.put('last_cron', new Date().toISOString()));
		return Promise.resolve();
	},
};
