<script lang="ts">
import { QueryClientProvider } from '@tanstack/svelte-query';
import { onMount } from 'svelte';
import HeroBg from '$lib/components/background/HeroBg.svelte';
import Footer from '$lib/components/layout/Footer.svelte';
import Header from '$lib/components/layout/Header.svelte';
import { createQueryClient } from '$lib/data/query-client';
import '$lib/styles/global.css';
import { fly } from 'svelte/transition';
import { page } from '$app/state';
import { createAuthClient } from '$lib/auth/auth-client';
import SettingsModal from '$lib/components/modal/SettingsModal.svelte';
import { setSessionState } from '$lib/stores/session';

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

onMount(async () => {
	const authClient = createAuthClient();
	try {
		const session = await authClient.getSession();
		setSessionState({ user: session.data?.user ?? null, ready: true });
	} catch {
		setSessionState({ user: null, ready: true });
	}
});
</script>

<svelte:head>
	<title>MidNight Network</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="app" data-sveltekit-preload-code="viewport" data-sveltekit-preload-data="hover">
		<HeroBg />
		<Header showSearchButton={page.url.pathname !== '/'} />
		{#key page.url.pathname}
		<main class="main" in:fly={{ duration: 300, delay: 300, x: 10 }} out:fly={{ duration: 300, x: -10 }}>
			{#if children}
				{@render children()}
			{/if}
		</main>
		{/key}
		<Footer />
		<SettingsModal />
	</div>
</QueryClientProvider>

<style>
	.main {
		padding-top: 56px;
		max-width: 840px;
		margin: 0 auto;
		margin-bottom: 80px;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.main {
			padding-left: 15px;
			padding-right: 15px;
			margin-bottom: 60px;
		}
	}
</style>
