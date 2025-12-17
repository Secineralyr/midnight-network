import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin, RequestHeadersPlugin } from '@orpc/server/plugins';
import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { router } from './rpc';

const rpc = new RPCHandler(router, {
	plugins: [
		new RequestHeadersPlugin(),
		new CORSPlugin({
			origin: (origin) => origin,
			allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
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
		'/api*',
		async ({ request }) => {
			const { response } = await rpc.handle(request, {
				prefix: '/api',
				context: {
					reqHeaders: request.headers,
				},
			});

			return response ?? new Response(null, { status: 404 });
		},
		{
			parse: 'none',
		},
	)
	.compile();

export default {
	fetch: app.fetch,
	scheduled(event: ScheduledEvent): Promise<void> {
		console.info('cron', event.cron);
		//ctx.waitUntil(env.SESSION_KV.put('last_cron', new Date().toISOString()));
		return Promise.resolve();
	},
};
