// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';

export const RERUN_LOCK_KEY = 'rerun:lock';
const RERUN_LOCK_TTL_SECONDS = 900; // 15分（Queue consumer の最大実行時間に合わせる）

export type RerunQueueMessage = {
	noteId: string;
	username: string;
	runId?: number;
	requestedAt: number;
};

type RerunLockStatus = 'queued' | 'running';

type RerunLockValue = {
	status: RerunLockStatus;
	enqueuedAt: number;
	runId?: number;
};

/**
 * Rerun ロックの取得を試みる。
 * ロックが既に存在する場合は false を返し、エンキューを拒否する。
 */
export async function tryAcquireRerunLock(runId?: number): Promise<boolean> {
	const existing = await env.CACHE.get<RerunLockValue>(RERUN_LOCK_KEY, 'json');
	if (existing !== null) {
		return false;
	}

	const lockValue: RerunLockValue = {
		status: 'queued',
		enqueuedAt: Date.now(),
		runId,
	};

	await env.CACHE.put(RERUN_LOCK_KEY, JSON.stringify(lockValue), {
		expirationTtl: RERUN_LOCK_TTL_SECONDS,
	});

	return true;
}

/**
 * ロックステータスを "running" に更新し、TTL をリフレッシュする。
 * Queue consumer の処理開始時に呼び出す。
 */
export async function updateRerunLockRunning(runId?: number): Promise<void> {
	const lockValue: RerunLockValue = {
		status: 'running',
		enqueuedAt: Date.now(),
		runId,
	};

	await env.CACHE.put(RERUN_LOCK_KEY, JSON.stringify(lockValue), {
		expirationTtl: RERUN_LOCK_TTL_SECONDS,
	});
}

/**
 * Rerun ロックを解放する。
 * 処理完了時または失敗時に呼び出す。
 */
export async function releaseRerunLock(): Promise<void> {
	await env.CACHE.delete(RERUN_LOCK_KEY);
}
