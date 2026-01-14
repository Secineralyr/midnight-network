<script lang="ts">
import { createQuery } from '@tanstack/svelte-query';
import { fetchMisskeyUser, misskeyUserQueryKey } from '$lib/data/misskey-users';

interface Props {
	userId?: string | null;
	alt?: string;
	loading?: 'eager' | 'lazy';
	decoding?: 'auto' | 'async' | 'sync';
}

const { userId = null, alt = '', loading = 'lazy', decoding = 'async' }: Props = $props();

const userQuery = createQuery(() => ({
	queryKey: userId ? misskeyUserQueryKey(userId) : ['misskeyUser', 'missing'],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for avatar query.');
		}
		return fetchMisskeyUser(userId);
	},
	enabled: Boolean(userId),
}));

const avatarUrl = $derived(userQuery.data?.avatarUrl ?? null);
const resolvedAlt = $derived(alt || userQuery.data?.username || userId || '');
</script>

{#if avatarUrl}
	<img class="avatar-image" src={avatarUrl} alt={resolvedAlt} {loading} {decoding} />
{:else}
	<div class="avatar-placeholder" aria-hidden="true"></div>
{/if}

<style>
	.avatar-image,
	.avatar-placeholder {
		width: 100%;
		height: 100%;
		display: block;
		border-radius: 9999px;
	}

	.avatar-image {
		object-fit: cover;
	}

	.avatar-placeholder {
		background: #fff;
	}
</style>
