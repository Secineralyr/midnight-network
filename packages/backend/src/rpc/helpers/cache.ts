import { env } from 'cloudflare:workers';

const CACHE_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<T>((resolve) => {
		timeoutId = setTimeout(() => resolve(fallback), CACHE_TIMEOUT_MS);
	});

	return Promise.race([
		promise.finally(() => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
			}
		}),
		timeoutPromise,
	]);
}

/**
 * 次回のターゲットマッチ時刻（UTC）を取得する。
 * キャッシュの有効期限として使用する。
 * @returns 次回のターゲットマッチ時刻（ミリ秒）
 */
export function getNextTargetMatchTime(): number {
	const now = new Date();
	const targetHour = env.TARGET_MATCH_HOUR;
	const targetMinutes = env.TARGET_MATCH_MINUTES;

	const nextTarget = new Date(now);
	nextTarget.setUTCHours(targetHour, targetMinutes, 0, 0);

	if (nextTarget.getTime() <= now.getTime()) {
		nextTarget.setUTCDate(nextTarget.getUTCDate() + 1);
	}

	return nextTarget.getTime();
}

/**
 * キャッシュの有効期限（TTL）を秒単位で取得する。
 * @returns TTL（秒）
 */
export function getCacheTtlSeconds(): number {
	const nextTargetTime = getNextTargetMatchTime();
	const now = Date.now();
	const ttlMs = nextTargetTime - now;
	const ttlSeconds = Math.floor(ttlMs / 1000);
	if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
		return 60;
	}
	return ttlSeconds;
}

/** キャッシュパラメータとして使用可能な型 */
type CacheParams = string | number | boolean | null | Record<string, string | number | boolean | null>;

/**
 * キャッシュキーを生成する。
 * @param prefix キャッシュのプレフィクス
 * @param params パラメータ（文字列化される）
 * @returns キャッシュキー
 */
export function buildCacheKey<P extends CacheParams>(prefix: string, params: P): string {
	if (params === null) {
		return prefix;
	}
	const paramStr = typeof params === 'object' ? JSON.stringify(params) : String(params);
	return `${prefix}:${paramStr}`;
}

/**
 * キャッシュから値を取得する。
 * @param key キャッシュキー
 * @returns キャッシュされた値、または存在しない場合はnull
 */
export function getFromCache<T>(key: string): Promise<T | null> {
	return withTimeout(env.CACHE.get<T>(key, 'json'), null).catch(() => null);
}

/**
 * キャッシュに値を保存する。
 * @param key キャッシュキー
 * @param value 保存する値
 * @param ttlSeconds TTL（秒）
 */
export async function setToCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
	if (value === undefined) {
		return;
	}
	const serialized = JSON.stringify(value);
	if (serialized === undefined) {
		return;
	}
	await env.CACHE.put(key, serialized, { expirationTtl: ttlSeconds });
}

/**
 * キャッシュから取得し、なければ取得関数を実行してキャッシュする。
 * @param prefix キャッシュのプレフィクス
 * @param params パラメータ
 * @param fetchFn データ取得関数
 * @returns 取得したデータ
 */
export async function withCache<T, P extends CacheParams>(prefix: string, params: P, fetchFn: () => Promise<T>): Promise<T> {
	const key = buildCacheKey(prefix, params);
	const cached = await getFromCache<T>(key);
	if (cached !== null) {
		return cached;
	}

	const data = await fetchFn();
	const ttl = getCacheTtlSeconds();
	setToCache(key, data, ttl).catch((error) => {
		console.warn('cache.put.failed', { key, error });
	});
	return data;
}
