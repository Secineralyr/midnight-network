import { env } from 'cloudflare:workers';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin, RequestHeadersPlugin } from '@orpc/server/plugins';
import { Elysia, t } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { processCronMain, processCronRemind } from './cron';
import { router } from './rpc';
import { mkWebhookTypes, processWebhook } from './webhook';

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
				'User-Agent': t.Literal('Misskey-Hooks'),
				'X-Misskey-Host': t.Literal(env.MK_HOST),
				'Content-Type': t.Literal('application/json'),
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
