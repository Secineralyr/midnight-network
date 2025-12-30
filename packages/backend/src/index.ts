import { env } from 'cloudflare:workers';
import cors from '@elysiajs/cors';
import { createHostToOrigin } from '@midnight-network/shared/url';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { RequestHeadersPlugin } from '@orpc/server/plugins';
import { Elysia, t } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { auth } from './auth';
import { processCronMain, processCronRemind } from './cron';
import { router } from './rpc';
import { mkWebhookTypes, processWebhook } from './webhook';

const rpc = new RPCHandler(router, {
	plugins: [new RequestHeadersPlugin()],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const app = new Elysia({
	adapter: CloudflareAdapter,
})
	.use(
		cors({
			origin: createHostToOrigin(env.WEB_HOST),
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			credentials: true,
			allowedHeaders: ['Content-Type', 'Authorization'],
		}),
	)
	.post(
		'/webhook',
		async ({ body }) => {
			console.info('start webhook process');
			await processWebhook(body);
			console.info('end webhook process');
			return new Response(null, { status: 204 });
		},
		{
			headers: t.Object({
				'user-agent': t.Literal('Misskey-Hooks'),
				'x-misskey-host': t.Literal(env.MK_HOST),
				'content-type': t.Literal('application/json'),
			}),
			body: t.Object({
				eventId: t.String(),
				hookId: t.String(),
				type: t.UnionEnum(mkWebhookTypes),
				body: t.Any(), // typeによってbodyの中身が異なるため、この推論は行わない
				userId: t.String(),
				server: t.String(),
				createdAt: t.Numeric(),
			}),
		},
	)
	.mount(auth.handler)
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
	async scheduled(event: ScheduledEvent) {
		const cron = event.cron;
		console.info('cron start:', cron);
		switch (cron) {
			case env.crons.CRON_DAILY:
				await processCronMain();
				break;
			case env.crons.CRON_DAILY_REMIND:
				await processCronRemind();
				break;
			default:
				break;
		}
		console.info('cron end:', cron);
		return;
	},
};
