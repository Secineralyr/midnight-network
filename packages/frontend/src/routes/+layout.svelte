<script lang="ts">
import { QueryClientProvider } from '@tanstack/svelte-query';
import { onMount } from 'svelte';
import { getMockUser, type MockUser } from '$lib/auth/mock-auth';
import HeroBg from '$lib/components/background/HeroBg.svelte';
import Footer from '$lib/components/layout/Footer.svelte';
import Header from '$lib/components/layout/Header.svelte';
import { createQueryClient } from '$lib/data/query-client';
import '$lib/styles/global.css';

/**
 * ルートレイアウト
 * @description 全ページ共通のレイアウト（Header, Footer, QueryProvider）
 */

interface Props {
	children?: import('svelte').Snippet;
}

const { children }: Props = $props();

const queryClient = createQueryClient();

/** 現在のユーザー情報（TODO: 認証連携） */
let currentUser = $state<MockUser | null>(null);

onMount(() => {
	currentUser = getMockUser();
});
</script>

<svelte:head>
	<title>MidNight Network</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="app">
		<HeroBg />
		<Header user={currentUser} />
		<main class="main">
			{#if children}
				{@render children()}
			{/if}
		</main>
		<Footer />
	</div>
</QueryClientProvider>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main {
		flex: 1;
		padding-top: var(--header-height);
	}
</style>
