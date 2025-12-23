import { env } from 'cloudflare:workers';
import type { Note } from 'misskey-js/entities.js';
import { createRetryMisskeyApiClientFetcher } from './misskey';
import { numberBetween } from './util';

// 今はmentionしかないけど、一応機能追加用にこうしてる
export const mkWebhookTypes = ['mention'] as const;
type MkWebhookTypeNames = (typeof mkWebhookTypes)[number];

type MkWebhookBody<T extends MkWebhookTypeNames> = T extends 'mention' ? Record<'note', Note> : never;

type MkWebhookRequestBody<T extends MkWebhookTypeNames = MkWebhookTypeNames> = {
	eventId: string;
	hookId: string;
	type: T;
	body: MkWebhookBody<T>;
	userId: string;
	server: string;
	createdAt: number;
};

const replyDateMatch = /([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])/;
const replyJapaneseDateMatch = /([1-9]|1[0-2])月([1-9]|[12][0-9]|3[01])日/;

const commands = {
	follow: /\/follow/,
	unfollow: /\/unfollow/,
	ping: /\/ping/,
} as const;

async function routeBotCommand(note: Note) {
	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/reactions/create', { noteId: note.id, reaction: '👍' });

	if (note.text && commands.follow.test(note.text)) {
		await mkApi('notes/reactions/create', { noteId: note.id, reaction: '✅' });
		return;
	}
	if (note.text && commands.unfollow.test(note.text)) {
		await mkApi('notes/reactions/create', { noteId: note.id, reaction: '👋' });
		return;
	}
	if (note.text && commands.ping.test(note.text)) {
		await mkApi('notes/reactions/create', { noteId: note.id, reaction: '✅' });
		return;
	}

	// TODO: 旧統計データを返す
}

async function postOriginalReplyAction(note: Note) {
	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/reactions/create', { noteId: note.id, reaction: '👍' });

	// TODO: 集計されていれば順位とタイム、そうでなければタイムだけ返す
}

function isDisableWebhook() {
	const nowTime = Date.now();
	return numberBetween(
		nowTime,
		nowTime - env.DISABLE_WEBHOOK_BEFORE_TARGET_MATCH,
		nowTime + env.DISABLE_WEBHOOK_AFTER_TARGET_MATCH,
	);
}

export async function processWebhook(ctx: MkWebhookRequestBody) {
	if (isDisableWebhook()) {
		return;
	}

	if (ctx.type !== 'mention') {
		return;
	}
	const note = ctx.body.note;

	if (note.user.isBot) {
		console.info('user is bot.');
		return;
	}

	if (
		note.reply?.text &&
		note.reply.userId === note.userId &&
		(note.reply.text.match(`(${env.GAME_JOIN_POST_TEXT_REGEX})`) ||
			replyDateMatch.test(note.reply.text) ||
			replyJapaneseDateMatch.test(note.reply.text))
	) {
		await postOriginalReplyAction(note);
	} else if (!note.replyId || env.BOT_USER_NAME === note.reply?.user?.username) {
		await routeBotCommand(note);
	}
}
