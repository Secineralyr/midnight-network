// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';
import type { UserRankStatus } from './generated/prisma/client';

const SNAPSHOT_ROOT = 'rank-status-snapshot';
const MATCH_DATE_PREFIX = 'matchDate';
const RUN_ID_PREFIX = 'runId';
const JSON_CONTENT_TYPE = 'application/json';
const RUN_ID_FROM_KEY_REGEXP = /\/runId\/(\d+)\.json$/;

export type UserRankStatusSnapshotItem = Omit<UserRankStatus, 'createdAt' | 'updatedAt'>;

export type UserRankStatusSnapshot = {
	matchDateId: number;
	runId: number;
	createdAt: number;
	status: UserRankStatusSnapshotItem[];
};

function buildMatchDatePrefix(matchDateId: number): string {
	return `${SNAPSHOT_ROOT}/${MATCH_DATE_PREFIX}/${matchDateId}/${RUN_ID_PREFIX}`;
}

function buildSnapshotKey(matchDateId: number, runId: number): string {
	return `${buildMatchDatePrefix(matchDateId)}/${runId}.json`;
}

function pickNearestRunId(runIds: number[], base: number): number {
	if (runIds.length === 0) {
		return -1;
	}

	const firstRunId = runIds[0];
	if (firstRunId === undefined) {
		return -1;
	}

	let picked = firstRunId;
	let minDiff = Math.abs(firstRunId - base);
	for (let i = 1; i < runIds.length; i += 1) {
		const runId = runIds[i];
		if (runId === undefined) {
			continue;
		}
		const diff = Math.abs(runId - base);
		if (diff < minDiff) {
			picked = runId;
			minDiff = diff;
		}
	}

	return picked;
}

function extractRunIdFromKey(key: string): number | null {
	const match = key.match(RUN_ID_FROM_KEY_REGEXP);
	const matchedRunId = match?.[1];
	if (!matchedRunId) {
		return null;
	}
	return Number(matchedRunId);
}

async function listSnapshotKeys(matchDateId: number): Promise<string[]> {
	const keys: string[] = [];
	let cursor: string | undefined;
	const prefix = `${buildMatchDatePrefix(matchDateId)}/`;
	while (true) {
		const result = await env.RANK_STATUS_SNAPSHOTS.list({
			prefix,
			cursor,
		});
		const listed = result.objects.map((obj) => obj.key);
		keys.push(...listed);

		if (!result.truncated) {
			break;
		}
		cursor = result.cursor;
	}

	return keys;
}

export async function writeUserRankStatusSnapshot(
	matchDateId: number,
	runId: number,
	status: UserRankStatusSnapshotItem[],
): Promise<void> {
	const payload: UserRankStatusSnapshot = {
		matchDateId,
		runId,
		createdAt: Date.now(),
		status,
	};

	await env.RANK_STATUS_SNAPSHOTS.put(buildSnapshotKey(matchDateId, runId), JSON.stringify(payload), {
		httpMetadata: {
			contentType: JSON_CONTENT_TYPE,
		},
	});
}

export async function readUserRankStatusSnapshot(
	matchDateId: number,
	requestedRunId?: number,
): Promise<UserRankStatusSnapshot | null> {
	const keys = await listSnapshotKeys(matchDateId);
	const runIdMap = new Map<number, string>();

	for (const key of keys) {
		const runId = extractRunIdFromKey(key);
		if (runId !== null) {
			runIdMap.set(runId, key);
		}
	}

	const runIds = [...runIdMap.keys()];
	if (runIds.length === 0) {
		return null;
	}

	const runId = requestedRunId ?? pickNearestRunId(runIds, Date.now());
	const snapshotKey = runIdMap.get(runId);
	if (!snapshotKey) {
		return null;
	}

	const result = await env.RANK_STATUS_SNAPSHOTS.get(snapshotKey);
	if (result === null) {
		return null;
	}

	const text = await result.text();
	if (!text) {
		return null;
	}

	const parsed: UserRankStatusSnapshot = JSON.parse(text);
	if (typeof parsed.matchDateId !== 'number' || typeof parsed.runId !== 'number' || !Array.isArray(parsed.status)) {
		return null;
	}

	return parsed;
}
