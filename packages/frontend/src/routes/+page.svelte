<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
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
import { sessionUser } from '$lib/stores/session';
import { onErrorImageDisplayNone } from '$lib/utils/style';

const queryClient = useQueryClient();

const currentUser = $derived($sessionUser);

/**
 * トップページ
 * @description ヒーローセクション、検索、カウントダウン、リザルト、Top3リーダーボード
 */

/** 今日の試合上位データ */
const todayTopQuery = createQuery(() => ({
	queryKey: ['todayTop'],
	queryFn: () => orpc.todayTop(),
	enabled: Boolean(currentUser),
}));

/** ランクpt上位データ */
const rankTopQuery = createQuery(() => ({
	queryKey: ['rankTop'],
	queryFn: () => orpc.rankTop(),
	enabled: Boolean(currentUser),
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
	queryKey: ['lastResult', currentUser?.id],
	queryFn: () => orpc.me.lastResult(),
	enabled: Boolean(currentUser),
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

<svelte:head>
	<title>Home - MidNight Network</title>
</svelte:head>

<div class="top-page">
	<section class="hero">
		<div>
			<div class="title-content">
				<div class="logo">
					<img src="/logo.png" alt="MidNight Network" class="logo-image" onerror={(e) => onErrorImageDisplayNone(e.currentTarget)} />
				</div>
				<h1 class="title">MidNight Network</h1>
			</div>
			<div class="search">
				<UserSearch onSelect={handleUserSelect} disabled={!currentUser} disabledTooltip="ログインしてください" />
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
		{#if currentUser}
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
		{:else}
			<div class="leaderboards__panel">
				<h3 class="leaderboard-section-title">今日の試合上位</h3>
				<p class="login-required-message">ログインしてください</p>
			</div>
			<div class="leaderboards__panel">
				<h3 class="leaderboard-section-title">ランクpt上位</h3>
				<p class="login-required-message">ログインしてください</p>
			</div>
		{/if}
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
		justify-content: center;
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

	.leaderboard-section-title {
		font-family: 'M PLUS 2', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 12px;
	}

	.login-required-message {
		font-family: 'M PLUS 2', sans-serif;
		font-size: 0.875rem;
		color: #6b6f7e;
		text-align: center;
		padding: 20px;
		background-color: #201E3A;
		border-radius: 4px;
	}

	.result-section {
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		margin-top: 80px;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.hero {
			margin-top: 60px;
		}
		.title {
			font-size: 1.8rem;
		}
		.logo-image {
			width: 48px;
			height: 48px;
		}
		.search {
			margin-top: 40px;
		}
		.countdown {
			margin-top: 40px;
		}
		.result-section {
			margin-top: 40px;
		}
		.leaderboards {
			flex-direction: column;
			margin: 0 40px;
			margin-top: 40px;
			gap: 20px;
		}
		.leaderboards__panel {
			width: 100%;
		}
	}

	@media (max-width: 649px) {
		.leaderboards {
			margin: unset;
			margin-top: 40px;
		}
	}
</style>
