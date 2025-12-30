import { env } from 'cloudflare:workers';
import type { Note } from 'misskey-js/entities.js';
import { prisma } from './db';
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

	if (!note.text) {
		return;
	}
	if (commands.follow.test(note.text)) {
		await mkApi('following/create', { userId: note.userId });
		await mkApi('notes/reactions/create', { noteId: note.id, reaction: '✅' });
	} else if (commands.unfollow.test(note.text)) {
		await mkApi('following/delete', { userId: note.userId });
		await mkApi('notes/reactions/create', { noteId: note.id, reaction: '👋' });
	} else if (commands.ping.test(note.text)) {
		await mkApi('notes/reactions/create', { noteId: note.id, reaction: '✅' });
	} else {
		const user = await prisma.user.findUnique({ where: { id: note.userId } });
		if (user) {
			const count = await prisma.record.count({ where: { userId: user.id } });
			const WithinTopCount = await prisma.record.count({ where: { userId: user.id, place: { gte: 1, lte: 10 } } });
			const firstCount = await prisma.record.count({ where: { userId: user.id, place: 1 } });
			const maxRank = await prisma.record.findFirst({
				where: { userId: user.id, place: { gte: 1 } },
				orderBy: [{ place: 'asc' }],
			});
			const maxRankString = maxRank ? `${maxRank.place}位` : 'なし';

			await mkApi('notes/create', {
				text: `@${note.user.username}\n参加回数：${count}\nランクイン回数：${WithinTopCount}\n最高ランク:${maxRankString}\n1位獲得回数：${firstCount}`,
				replyId: note.id,
			});
		} else {
			await mkApi('notes/create', {
				text: `@${note.user.username}\n記録なし`,
				replyId: note.id,
			});
		}
	}
}

const formatOptions: Intl.DateTimeFormatOptions = {
	timeZone: 'Asia/Tokyo',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
	fractionalSecondDigits: 3,
};

async function postOriginalReplyAction(note: Note) {
	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/reactions/create', { noteId: note.id, reaction: '👍' });

	const recordNote = note.reply;

	if (recordNote) {
		let resultText = '';

		const record = await prisma.record.findUnique({ where: { noteId: recordNote.id } });
		if (record) {
			const dateString = new Date(record.createdAt).toLocaleString('ja-JP', formatOptions);
			const place = record.place;

			resultText = `@${note.user.username}\n順位：${place}位\nノート時刻：${dateString}`;
		} else {
			const dateString = new Date(recordNote.createdAt).toLocaleString('ja-JP', formatOptions);
			resultText = `@${note.user.username}\nノート時刻：${dateString}`;
		}

		await mkApi('notes/create', {
			text: resultText,
			replyId: note.id,
		});
	}
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
