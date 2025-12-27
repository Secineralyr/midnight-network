import { env } from 'cloudflare:workers';
import type { Note } from 'misskey-js/entities.js';
import { placeEmojis } from './consts';
import { createRetryMisskeyApiClientFetcher } from './misskey';

export async function processCronMain() {
	const mkApi = createRetryMisskeyApiClientFetcher();

	const _target = new Date();
	_target.setUTCHours(15);
	_target.setUTCMinutes(0);
	_target.setUTCSeconds(0);
	const targetTime = _target.getTime();

	let untilTime = targetTime + 60 * 1000;
	const sinceTime = targetTime - 60 * 1000;

	const timeJst = new Date(untilTime + 9 * 3600 * 1000);
	const monthJst = timeJst.getMonth();
	const dayJst = timeJst.getDay();

	let notes: Note[] = [];
	const targetPattern = new RegExp(`${monthJst}/${dayJst}|${monthJst}月${dayJst}日|${env.GAME_JOIN_POST_TEXT_REGEX}`);

	while (true) {
		const res = await mkApi('notes/hybrid-timeline', {
			untilDate: untilTime,
			sinceDate: sinceTime,
			includeLocalRenotes: false,
			includeMyRenotes: false,
			includeRenotedMyNotes: false,
			limit: 100,
			withRenotes: false,
		});
		if (res.length == 0) {
			break;
		}
		untilTime = res.map((n) => Date.parse(n.createdAt)).reduce((t, next) => (t < next ? t : next), untilTime);
		const addend = res.filter((note) => note.text && targetPattern.test(note.text) && !(note.user.isBot ?? false));
		notes = notes.concat(addend);
	}

	const users = new Map<string, string>();
	const records = new Map<string, { uid: string; nid: string; dt: number; place: number }>();
	notes.forEach((n) => {
		const uid = n.userId;
		const dt = Date.parse(n.createdAt) - targetTime;
		if (!records.has(uid) || records.get(uid)!.dt > dt) {
			records.set(uid, {
				uid: uid,
				nid: n.id,
				dt: dt,
				place: -1,
			});
		}
		users.set(uid, n.user.username);
	});

	const validRecords = [...records.values()].filter((n) => n.dt >= 0);
	const flyingRecords = [...records.values()].filter((n) => n.dt < 0);

	const validCount = validRecords.length;
	const flyingCount = [...records.values()].length - validCount;

	const host = env.WEB_HOST;
	const noteTitle = env.POST_MATCH_RESULT_TITLE;
	const noteUrl = env.POST_MATCH_RESULT_URL.replace('{host}', host);

	const ranking: string[] = [];
	const dts = [...new Set<number>(validRecords.map((r) => r.dt))];
	dts.sort((a, b) => a - b);
	for (let i = 0; i < dts.length; i++) {
		validRecords
			.filter((r) => r.dt == dts[i])
			.forEach((r) => {
				r.place = i + 1;
				if (i < 10) {
					let mention = '';
					if (users.has(r.uid)) {
						mention = `@${users.get(r.uid)!}`;
					}
					ranking.push(`${placeEmojis[i + 1]} ${mention} +${(r.dt / 1000).toFixed(3)}s`);
				}
			});
	}
	const rankText = ranking.join('\n');

	const resultText = env.POST_MATCH_RESULT_TEMPLATE.replace('{title}', noteTitle)
		.replace('{ranks}', rankText)
		.replace('{valid}', validCount.toFixed(0))
		.replace('{flying}', flyingCount.toFixed(0))
		.replace('{url}', noteUrl);

	await mkApi('notes/create', { text: resultText });

	return;

	// TODO: 実際の集計タスク (+ 今回の独自実装ランク計算をrank-calcにあるやつで1ユーザーずつ計算していれる)
}

export async function processCronRemind() {
	const mkApi = createRetryMisskeyApiClientFetcher();
	await mkApi('notes/create', { text: env.POST_MATCH_REMIND_TEXT });
	return;
	// TODO: リマインド用ノート投稿タスク
}
