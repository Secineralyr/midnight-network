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

<div class="top-page">
	<section class="hero">
		<div>
			<div class="title-content">
				<div class="logo">
					<img src="/logo.png" alt="MidNight Network" class="logo-image" />
				</div>
				<h1 class="title">MidNight Network</h1>
			</div>
			<div class="search">
				<UserSearch onSelect={handleUserSelect} />
			</div>
		</div>
	</section>

	<section class="countdown">
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
		text-align: center;
		margin-top: 100px;
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo-image {
		width: 64px;
		height: 64px;
	}

	.title-content {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.title {
		font-size: 2.3rem;
		font-weight: 600;
		color: #fff;
	}

	.search {
		margin-top: 80px;
	}

	.countdown {
		margin-top: 80px;
	}
</style>
