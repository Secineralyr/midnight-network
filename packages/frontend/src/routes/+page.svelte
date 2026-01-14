<script lang="ts">
import type { ApiSimpleUserInfoT } from '@midnight-network/shared/rpc/models';
import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import Countdown from '$lib/components/countdown/Countdown.svelte';
import Top3Leaderboard from '$lib/components/leaderboard/Top3Leaderboard.svelte';
import LastResult from '$lib/components/result/LastResult.svelte';
import UserSearch from '$lib/components/search/UserSearch.svelte';
import { primeMisskeyUsers } from '$lib/data/misskey-users';
import { orpc } from '$lib/orpc';

const queryClient = useQueryClient();

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

const topUserIds = $derived([
	...(todayTopQuery.data?.map((item) => item.user.userId) ?? []),
	...(rankTopQuery.data?.map((item) => item.user.userId) ?? []),
]);

$effect(() => {
	if (topUserIds.length === 0) {
		return;
	}
	primeMisskeyUsers(queryClient, topUserIds).catch(() => null);
});

/** 前回のリザルト（ログインユーザーのみ） */
const lastResultQuery = createQuery(() => ({
	queryKey: ['lastResult'],
	queryFn: () => orpc.me.lastResult(),
	enabled: false,
}));

function getTargetTime() {
	const now = new Date();
	const target = new Date(now.getTime());
	target.setUTCHours(Number(import.meta.env.VITE_TARGET_HOUR), Number(import.meta.env.VITE_TARGET_MINUTES), 0, 0);
	if (target.getTime() < now.getTime()) {
		target.setUTCDate(target.getUTCDate() + 1);
	}
	return target.getTime();
}

/** 次の集計時刻（00:00 JST） */
const nextAggregationTime = $derived(getTargetTime());

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
		<Countdown targetTime={nextAggregationTime} />
	</section>

	{#if lastResultQuery.data}
		<section class="result-section">
			<LastResult result={lastResultQuery.data} isLoading={lastResultQuery.isLoading} />
		</section>
	{/if}

	<section class="leaderboards">
		<div class="leaderboards__panel">
			<Top3Leaderboard
				title="今日の試合上位"
				type="today"
				todayData={todayTopQuery.data}
				isLoading={todayTopQuery.isLoading}
				onUserSelect={handleUserCardClick}
			/>
		</div>
		<div class="leaderboards__panel">
			<Top3Leaderboard
				title="ランクpt上位"
				type="rankPt"
				rankPtData={rankTopQuery.data}
				isLoading={rankTopQuery.isLoading}
				onUserSelect={handleUserCardClick}
			/>
		</div>
	</section>
</div>

<style>
	.top-page {
		display: flex;
		flex-direction: column;
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

	.leaderboards {
		display: flex;
		margin: 0 auto;
		margin-top: 80px;
		gap: 30px;
	}

	.leaderboards__panel {
		width: 320px;
	}

	.result-section {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}
</style>
