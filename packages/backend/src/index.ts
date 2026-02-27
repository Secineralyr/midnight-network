// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';
import cors from '@elysiajs/cors';
import { createHostToOrigin } from '@midnight-network/shared/url';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { RequestHeadersPlugin } from '@orpc/server/plugins';
import { Elysia, t } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { auth } from './auth';
import { processCronMain, processCronMainRerun, processCronRemind } from './cron';
import { createRetryMisskeyApiClientFetcher } from './misskey';
import { checkRateLimit, createRateLimitResponse } from './rate-limit';
import type { RerunQueueMessage } from './rerun-queue';
import { releaseRerunLock, updateRerunLockRunning } from './rerun-queue';
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
	.post(
		'/webhook',
		async ({ body }) => {
			console.info('start webhook process');
			await processWebhook(body);
			console.info('end webhook process');
			return new Response(null, { status: 200 });
		},
		{
			headers: t.Object({
				'user-agent': t.Literal('Misskey-Hooks'),
				'x-misskey-host': t.Literal(env.MK_HOST),
				'x-misskey-hook-secret': t.Literal(env.WEBHOOK_SECRET),
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
			const allowed = await checkRateLimit(request);
			if (!allowed) {
				return createRateLimitResponse();
			}

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
	async queue(batch: MessageBatch<RerunQueueMessage>) {
		const message = batch.messages[0];
		if (message === undefined) {
			console.error('queue: message is none?');
			return;
		}

		const { noteId, username, runId } = message.body;
		try {
			console.info(`queue: start rerun. [ runId = ${runId}, noteId = ${noteId} ]`);

			await updateRerunLockRunning(runId);
			await processCronMainRerun(runId);
			await releaseRerunLock();

			message.ack();
			console.info(`queue: rerun completed. [ runId = ${runId}, noteId = ${noteId} ]`);
		} catch (error) {
			console.error(`queue: rerun failed. ${error}`);
			// ロックは解放せずリトライ（TTL で最終的に自動解放される）
			message.retry();
		}

		const mkApi = createRetryMisskeyApiClientFetcher();
		await mkApi('notes/create', {
			text: `@${username} Rerun Finished!`,
			replyId: noteId,
			visibility: 'specified',
		});
	},
	async scheduled(event: ScheduledEvent) {
		const cron = event.cron;
		console.info(`cron start: ${cron}`);
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
		console.info(`cron end: ${cron}`);
		return;
	},
};
