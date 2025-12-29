<script lang="ts">
import type { ApiSimpleUserInfoT } from '@midnight-network/shared/rpc/models';
import { createQuery } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import Countdown from '$lib/components/countdown/Countdown.svelte';
import Top3Leaderboard from '$lib/components/leaderboard/Top3Leaderboard.svelte';
import LastResult from '$lib/components/result/LastResult.svelte';
import UserSearch from '$lib/components/search/UserSearch.svelte';
import { orpc } from '$lib/orpc';

/**
 * トップページ
 * @description ヒーローセクション、検索、カウントダウン、リザルト、Top3リーダーボード
 */

/** 今日の試合上位データ */
const todayTopQuery = createQuery(() => ({
	queryKey: ['todayTop'],
	queryFn: () => orpc.todayTop(),
}));

/** ランクpt上位データ */
const rankTopQuery = createQuery(() => ({
	queryKey: ['rankTop'],
	queryFn: () => orpc.rankTop(),
}));

/** 前回のリザルト（ログインユーザーのみ） */
const lastResultQuery = createQuery(() => ({
	queryKey: ['lastResult'],
	queryFn: () => orpc.me.lastResult(),
	enabled: false,
}));

/** 次の集計時刻（00:00 JST） */
const nextAggregationTime = $derived(() => {
	const now = new Date();
	const jstOffset = 9 * 60 * 60 * 1000;
	const nowJst = new Date(now.getTime() + jstOffset);
	const tomorrow = new Date(nowJst);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow.getTime() - jstOffset;
});

/**
 * ユーザー選択時のハンドラ
 * @param user - 選択されたユーザー
 */
function handleUserSelect(user: ApiSimpleUserInfoT): void {
	goto(`/user/${user.username}`);
}

/**
 * ユーザーカードクリック時のハンドラ
 * @param username - ユーザー名
 */
function handleUserCardClick(username: string): void {
	goto(`/user/${username}`);
}
</script>

<svelte:head>
	<title>MidNight Network</title>
</svelte:head>

<div class="top-page">
	<section class="hero">
		<div class="hero__content">
			<div class="hero__logo">
				<img src="/images/logo.svg" alt="MidNight Network" class="hero__logo-image" />
			</div>
			<h1 class="hero__title font-alphanumeric">MidNight Network</h1>
			<div class="hero__search">
				<UserSearch onSelect={handleUserSelect} />
			</div>
		</div>
	</section>

	<section class="countdown-section">
		<Countdown targetTime={nextAggregationTime()} />
	</section>

	{#if lastResultQuery.data}
		<section class="result-section container">
			<LastResult result={lastResultQuery.data} isLoading={lastResultQuery.isLoading} />
		</section>
	{/if}

	<section class="leaderboards-section container">
		<div class="leaderboards">
			<div class="leaderboards__item card">
				<Top3Leaderboard
					title="今日の試合上位"
					type="today"
					todayData={todayTopQuery.data}
					isLoading={todayTopQuery.isLoading}
					onUserSelect={handleUserCardClick}
				/>
			</div>
			<div class="leaderboards__item card">
				<Top3Leaderboard
					title="ランクpt上位"
					type="rankPt"
					rankPtData={rankTopQuery.data}
					isLoading={rankTopQuery.isLoading}
					onUserSelect={handleUserCardClick}
				/>
			</div>
		</div>
	</section>
</div>

<style>
	.top-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2xl);
		padding-bottom: var(--spacing-3xl);
	}

	.hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		text-align: center;
		padding: var(--spacing-3xl) var(--spacing-lg);
	}

	.hero__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xl);
		max-width: 600px;
	}

	.hero__logo {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero__logo-image {
		width: 80px;
		height: 80px;
	}

	.hero__title {
		font-size: var(--font-size-4xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.hero__search {
		width: 100%;
	}

	.countdown-section {
		display: flex;
		justify-content: center;
	}

	.result-section {
		max-width: 600px;
	}

	.leaderboards-section {
		max-width: var(--content-max-width);
	}

	.leaderboards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-lg);
	}

	.leaderboards__item {
		min-width: 0;
	}

	@media (max-width: 768px) {
		.hero__title {
			font-size: var(--font-size-2xl);
		}

		.leaderboards {
			grid-template-columns: 1fr;
		}
	}
</style>
