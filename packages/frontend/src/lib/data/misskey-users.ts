import { createHostToOrigin } from '@midnight-network/shared/url';
import type { QueryClient } from '@tanstack/svelte-query';
import { APIClient as MkAPIClient } from 'misskey-js/api.js';
import type { UserDetailed } from 'misskey-js/entities.js';

export type MisskeyUserSummary = {
	id: string;
	username: string;
	avatarUrl: string | null;
};

const misskeyHost = import.meta.env.VITE_MISSKEY_HOST || 'misskey.io';

const misskeyClient = new MkAPIClient({
	origin: createHostToOrigin(misskeyHost),
});

export const misskeyUserQueryKey = (userId: string) => ['misskeyUser', userId] as const;

const MAX_BATCH = 100;
const BATCH_DELAY_MS = 0;

type PendingResolver = {
	resolve: (user: MisskeyUserSummary | null) => void;
	reject: (error: unknown) => void;
};

const pendingUserIds = new Set<string>();
const inFlightUserIds = new Set<string>();
const pendingResolvers = new Map<string, PendingResolver[]>();
let batchTimer: ReturnType<typeof setTimeout> | undefined;

function normalizeUserResponse(response: UserDetailed | UserDetailed[]): UserDetailed[] {
	return Array.isArray(response) ? response : [response];
}

async function requestUsers(userIds: string[]): Promise<MisskeyUserSummary[]> {
	const response = (await misskeyClient.request('users/show', { userIds, detail: false })) as UserDetailed | UserDetailed[];
	const users = normalizeUserResponse(response);

	return users
		.filter((user) => Boolean(user?.id))
		.map((user) => ({
			id: user.id,
			username: user.username,
			avatarUrl: user.avatarUrl ?? null,
		}));
}

function scheduleBatch(): void {
	if (batchTimer) {
		return;
	}

	batchTimer = setTimeout(() => {
		batchTimer = undefined;
		flushBatch().catch(() => null);
	}, BATCH_DELAY_MS);
}

async function flushBatch(): Promise<void> {
	const userIds = Array.from(pendingUserIds);
	pendingUserIds.clear();
	if (userIds.length === 0) {
		return;
	}

	for (let i = 0; i < userIds.length; i += MAX_BATCH) {
		const chunk = userIds.slice(i, i + MAX_BATCH);
		await processChunk(chunk);
	}
}

function markInFlight(userIds: string[]): void {
	for (const userId of userIds) {
		inFlightUserIds.add(userId);
	}
}

function clearInFlight(userIds: string[]): void {
	for (const userId of userIds) {
		inFlightUserIds.delete(userId);
	}
}

function resolveChunk(userIds: string[], users: MisskeyUserSummary[]): void {
	const userMap = new Map(users.map((user) => [user.id, user]));

	for (const userId of userIds) {
		const resolvers = pendingResolvers.get(userId);
		if (!resolvers) {
			continue;
		}
		const user = userMap.get(userId) ?? null;
		for (const resolver of resolvers) {
			resolver.resolve(user);
		}
		pendingResolvers.delete(userId);
	}
}

function rejectChunk(userIds: string[], error: unknown): void {
	for (const userId of userIds) {
		const resolvers = pendingResolvers.get(userId);
		if (!resolvers) {
			continue;
		}
		for (const resolver of resolvers) {
			resolver.reject(error);
		}
		pendingResolvers.delete(userId);
	}
}

async function processChunk(userIds: string[]): Promise<void> {
	markInFlight(userIds);
	try {
		const users = await requestUsers(userIds);
		resolveChunk(userIds, users);
	} catch (error) {
		rejectChunk(userIds, error);
	} finally {
		clearInFlight(userIds);
	}
}

export async function fetchMisskeyUsers(userIds: string[]): Promise<MisskeyUserSummary[]> {
	const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
	if (uniqueIds.length === 0) {
		return [];
	}

	const results: MisskeyUserSummary[] = [];
	for (let i = 0; i < uniqueIds.length; i += MAX_BATCH) {
		const chunk = uniqueIds.slice(i, i + MAX_BATCH);
		const users = await requestUsers(chunk);
		results.push(...users);
	}

	return results;
}

export function fetchMisskeyUser(userId: string): Promise<MisskeyUserSummary | null> {
	if (!userId) {
		return Promise.resolve(null);
	}

	return new Promise((resolve, reject) => {
		const resolvers = pendingResolvers.get(userId) ?? [];
		resolvers.push({ resolve, reject });
		pendingResolvers.set(userId, resolvers);

		if (inFlightUserIds.has(userId)) {
			return;
		}

		pendingUserIds.add(userId);
		scheduleBatch();
	});
}

export async function primeMisskeyUsers(queryClient: QueryClient, userIds: string[]): Promise<void> {
	const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
	if (uniqueIds.length === 0) {
		return;
	}

	const missingIds = uniqueIds.filter((userId) => {
		const cachedUser = queryClient.getQueryData(misskeyUserQueryKey(userId));
		const isQueued = pendingUserIds.has(userId) || inFlightUserIds.has(userId);
		return !(cachedUser || isQueued);
	});
	if (missingIds.length === 0) {
		return;
	}

	const users = await fetchMisskeyUsers(missingIds);
	for (const user of users) {
		queryClient.setQueryData(misskeyUserQueryKey(user.id), user);
	}
}
