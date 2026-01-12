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
			origin: env.ENVIRONMENT === 'production' ? createHostToOrigin(env.WEB_HOST) : true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			credentials: true,
			allowedHeaders: ['Content-Type', 'Authorization'],
		}),
	)
	.get('/', () => {
		// IndieAuth用のメタデータHTML
		// MisskeyがclientIdのURLをフェッチしてredirect_uriを検証する
		const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MidNight Network API</title>
  <link rel="redirect_uri" href="/api/auth/oauth2/callback/misskey">
</head>
<body>
  <div class="h-app">
    <p class="p-name">MidNight Network</p>
    <a href="${createHostToOrigin(env.WEB_HOST)}" class="u-url">MidNight Network</a>
  </div>
</body>
</html>`;
		return new Response(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
		});
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
	.all('/api/auth/*', ({ request }) => auth.handler(request))
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
