<script lang="ts">
import type { SettingTypeT } from '@midnight-network/shared/rpc/me/models';
import { GraphSpan } from '@midnight-network/shared/rpc/user/models';
import { IconSettings } from '@tabler/icons-svelte';
import { createMutation, createQuery } from '@tanstack/svelte-query';
import { page } from '$app/stores';
import BarChart from '$lib/components/charts/BarChart.svelte';
import Heatmap from '$lib/components/charts/Heatmap.svelte';
import LineChart from '$lib/components/charts/LineChart.svelte';
import RadarChart from '$lib/components/charts/RadarChart.svelte';
import SettingsModal from '$lib/components/modal/SettingsModal.svelte';
import RankDisplay from '$lib/components/rank/RankDisplay.svelte';
import Button from '$lib/components/ui/Button.svelte';
import RankStatus from '$lib/components/user/RankStatus.svelte';
import Statistics from '$lib/components/user/Statistics.svelte';
import { orpc } from '$lib/orpc';

/**
 * ユーザープロフィールページ
 * @description ユーザーの詳細情報、統計、チャートを表示
 */

/** ユーザー名 */
const username = $derived($page.params.username);

/** グラフの期間の型 */
type GraphSpanValue = (typeof GraphSpan)[keyof typeof GraphSpan];

/** グラフの期間 */
let graphSpan = $state<GraphSpanValue>(GraphSpan.Daily);

/** 設定モーダル表示状態 */
let isSettingsOpen = $state(false);

/** 自分のプロフィールかどうか（TODO: 認証連携） */
const isOwnProfile = $state(false);

/** ユーザープロフィール取得 */
const profileQuery = createQuery(() => ({
	queryKey: ['user', 'profile', username],
	queryFn: () => orpc.user.profile(username),
}));

/** 累計pt推移データ */
const totalPtQuery = createQuery(() => ({
	queryKey: ['user', 'totalPt', username, graphSpan],
	queryFn: () => orpc.user.totalPtChart({ userId: username, span: graphSpan }),
}));

/** 獲得pt推移データ */
const earnedPtQuery = createQuery(() => ({
	queryKey: ['user', 'earnedPt', username, graphSpan],
	queryFn: () => orpc.user.earnedPtChart({ userId: username, span: graphSpan }),
}));

/** レーダーチャートデータ */
const radarQuery = createQuery(() => ({
	queryKey: ['user', 'radar', username],
	queryFn: () => orpc.user.radarChart(username),
}));

/** ヒートマップデータ */
const heatmapQuery = createQuery(() => ({
	queryKey: ['user', 'heatmap', username],
	queryFn: () => orpc.user.heatmapChart(username),
}));

/** 設定取得 */
const settingsQuery = createQuery(() => ({
	queryKey: ['settings'],
	queryFn: () => orpc.me.getSettings(),
	enabled: isOwnProfile,
}));

/** 設定更新ミューテーション */
const settingsMutation = createMutation(() => ({
	mutationFn: (settings: Partial<SettingTypeT>) => orpc.me.setSettings(settings),
	onSuccess: () => {
		settingsQuery.refetch();
	},
}));

/** 期間オプション */
const spanOptions = [
	{ label: '日別', value: String(GraphSpan.Daily) },
	{ label: '週別', value: String(GraphSpan.Weakly) },
	{ label: '月別', value: String(GraphSpan.Monthly) },
];

/**
 * グラフ期間変更ハンドラ
 * @param span - 期間
 */
function handleSpanChange(span: string): void {
	graphSpan = Number(span) as GraphSpanValue;
}

/**
 * 設定モーダルを開く
 */
function openSettings(): void {
	isSettingsOpen = true;
}

/**
 * 設定モーダルを閉じる
 */
function closeSettings(): void {
	isSettingsOpen = false;
}

/**
 * 設定保存ハンドラ
 * @param settings - 新しい設定
 */
function handleSaveSettings(settings: Partial<SettingTypeT>): void {
	settingsMutation.mutate(settings);
}
</script>

<svelte:head>
	<title>@{username} - MidNight Network</title>
</svelte:head>

<div class="user-page">
	<div class="user-page__header">
		<div class="user-page__profile">
			<img
				src="/images/default-avatar.png"
				alt={username}
				class="user-page__avatar"
			/>
			<h1 class="user-page__username font-alphanumeric">@{username}</h1>
		</div>
		{#if isOwnProfile}
			<Button variant="ghost" onclick={openSettings}>
				<IconSettings size={20} />
				設定
			</Button>
		{/if}
	</div>

	{#if profileQuery.data}
		<div class="user-page__content container">
			<div class="user-page__grid">
				<aside class="user-page__sidebar">
					<div class="card">
						<RankDisplay
							currentRank={profileQuery.data.currentRank}
							isLoading={profileQuery.isLoading}
						/>
					</div>
					<div class="card">
						<RankStatus
							rankStatus={profileQuery.data.rankStatus}
							isLoading={profileQuery.isLoading}
						/>
					</div>
				</aside>

				<main class="user-page__main">
					{#if profileQuery.data.statistics}
						<Statistics
							statistics={profileQuery.data.statistics}
							isLoading={profileQuery.isLoading}
						/>
					{/if}

					<div class="charts-grid">
						{#if totalPtQuery.data}
							<LineChart
								title="累計pt推移"
								data={totalPtQuery.data.map((d) => ({
									label: d.label,
									value: d.value,
								}))}
								spanOptions={spanOptions}
								currentSpan={String(graphSpan)}
								onSpanChange={handleSpanChange}
								isLoading={totalPtQuery.isLoading}
							/>
						{/if}

						{#if earnedPtQuery.data}
							<BarChart
								title="獲得pt推移"
								data={earnedPtQuery.data.map((d) => ({
									label: d.label,
									value: d.value,
								}))}
								spanOptions={spanOptions}
								currentSpan={String(graphSpan)}
								onSpanChange={handleSpanChange}
								isLoading={earnedPtQuery.isLoading}
							/>
						{/if}

						{#if radarQuery.data}
							<RadarChart
								title="チャート"
								data={radarQuery.data}
								isLoading={radarQuery.isLoading}
							/>
						{/if}

						{#if heatmapQuery.data}
							<Heatmap
								title="ビートマップ"
								data={heatmapQuery.data}
								isLoading={heatmapQuery.isLoading}
							/>
						{/if}
					</div>
				</main>
			</div>
		</div>
	{:else if profileQuery.isLoading}
		<div class="user-page__loading">
			<p>読み込み中...</p>
		</div>
	{:else}
		<div class="user-page__not-found">
			<p>ユーザーが見つかりませんでした</p>
		</div>
	{/if}
</div>

{#if isOwnProfile && settingsQuery.data}
	<SettingsModal
		settings={settingsQuery.data}
		isOpen={isSettingsOpen}
		onClose={closeSettings}
		onSave={handleSaveSettings}
	/>
{/if}

<style>
	.user-page {
		padding-bottom: var(--spacing-3xl);
	}

	.user-page__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-2xl) var(--spacing-lg);
		max-width: var(--content-max-width);
		margin: 0 auto;
	}

	.user-page__profile {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.user-page__avatar {
		width: 80px;
		height: 80px;
		border-radius: var(--radius-full);
		object-fit: cover;
		border: 3px solid var(--color-border-secondary);
	}

	.user-page__username {
		font-size: var(--font-size-3xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.user-page__content {
		max-width: var(--content-max-width);
	}

	.user-page__grid {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: var(--spacing-xl);
	}

	.user-page__sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.user-page__main {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-lg);
	}

	.user-page__loading,
	.user-page__not-found {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
		color: var(--color-text-secondary);
	}

	@media (max-width: 1024px) {
		.user-page__grid {
			grid-template-columns: 1fr;
		}

		.user-page__sidebar {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.user-page__sidebar > .card {
			flex: 1;
			min-width: 280px;
		}
	}

	@media (max-width: 768px) {
		.user-page__header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-md);
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
