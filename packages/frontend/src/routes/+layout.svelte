<script lang="ts">
import { QueryClientProvider } from '@tanstack/svelte-query';
import { onMount } from 'svelte';
import HeroBg from '$lib/components/background/HeroBg.svelte';
import Footer from '$lib/components/layout/Footer.svelte';
import Header from '$lib/components/layout/Header.svelte';
import { createQueryClient } from '$lib/data/query-client';
import '$lib/styles/global.css';
import type { User } from 'better-auth';
import { fly } from 'svelte/transition';
import { page } from '$app/state';
import { createAuthClient } from '$lib/auth/auth-client';

/**
 * ルートレイアウト
 * @description 全ページ共通のレイアウト（Header, Footer, QueryProvider）
 */

interface Props {
	children?: import('svelte').Snippet;
}

const { children }: Props = $props();

const queryClient = createQueryClient();

/** 現在のユーザー情報 */
let currentUser = $state<User | null>(null);

onMount(async () => {
	const authClient = createAuthClient();
	const session = await authClient.getSession();
	if (session.data) {
		currentUser = session.data.user;
	}
});
</script>

<svelte:head>
	<title>MidNight Network</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="app" data-sveltekit-preload-code="viewport" data-sveltekit-preload-data="hover">
		<HeroBg />
		<Header user={currentUser} showSearchButton={page.url.pathname !== '/'} />
		{#key page.url.pathname}
		<main class="main" in:fly={{ duration: 300, delay: 300, x: 10 }} out:fly={{ duration: 300, x: -10 }}>
			{#if children}
				{@render children()}
			{/if}
		</main>
		{/key}
		<Footer />
	</div>
</QueryClientProvider>

<style>
	.main {
		padding-top: 56px;
		max-width: 840px;
		margin: 0 auto;
		margin-bottom: 80px;
	}
</style>
