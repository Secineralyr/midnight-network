<script lang="ts">
import type { SettingTypeT } from '@midnight-network/shared/rpc/me/models';
import { GraphSpan } from '@midnight-network/shared/rpc/user/models';
import { IconSettings } from '@tabler/icons-svelte';
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
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
import UserAvatar from '$lib/components/user/UserAvatar.svelte';
import { primeMisskeyUsers } from '$lib/data/misskey-users';
import { orpc } from '$lib/orpc';

/**
 * ユーザープロフィールページ
 * @description ユーザーの詳細情報、統計、チャートを表示
 */

/** ユーザー名 */
const username = $derived($page.params.username);

const queryClient = useQueryClient();

const userIdQuery = createQuery(() => ({
	queryKey: ['user', 'resolveId', username],
	queryFn: async () => {
		if (!username) {
			return null;
		}

		const users = await orpc.searchUser(username);
		return (
			users.find((user) => user.username === username) ??
			users.find((user) => user.username.toLowerCase() === username.toLowerCase()) ??
			null
		);
	},
}));

const userId = $derived(userIdQuery.data?.userId ?? null);

$effect(() => {
	if (!userId) {
		return;
	}
	primeMisskeyUsers(queryClient, [userId]).catch(() => null);
});

/** グラフの期間の型 */
type GraphSpanValue = (typeof GraphSpan)[keyof typeof GraphSpan];

/** グラフの期間（各チャート個別） */
let totalPtSpan = $state<GraphSpanValue>(GraphSpan.Daily);
let earnedPtSpan = $state<GraphSpanValue>(GraphSpan.Daily);
let postTimeSpan = $state<GraphSpanValue>(GraphSpan.Daily);

/** 設定モーダル表示状態 */
let isSettingsOpen = $state(false);

/** 自分のプロフィールかどうか（TODO: 認証連携） */
const isOwnProfile = $state(false);

/** ユーザープロフィール取得 */
const profileQuery = createQuery(() => ({
	queryKey: ['user', 'profile', userId],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for profile query.');
		}
		return orpc.user.profile(userId);
	},
	enabled: Boolean(userId),
}));

/** 累計pt推移データ */
const totalPtQuery = createQuery(() => ({
	queryKey: ['user', 'totalPt', userId, totalPtSpan],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for totalPtChart query.');
		}
		return orpc.user.totalPtChart({ userId, span: totalPtSpan });
	},
	enabled: Boolean(userId),
}));

/** 獲得pt推移データ */
const earnedPtQuery = createQuery(() => ({
	queryKey: ['user', 'earnedPt', userId, earnedPtSpan],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for earnedPtChart query.');
		}
		return orpc.user.earnedPtChart({ userId, span: earnedPtSpan });
	},
	enabled: Boolean(userId),
}));

/** 投稿タイム推移チャート */
const postTimeQuery = createQuery(() => ({
	queryKey: ['user', 'postTime', userId, postTimeSpan],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for postTimeChart query.');
		}
		return orpc.user.postTimeChart({ userId, span: postTimeSpan });
	},
	enabled: Boolean(userId),
}));

/** レーダーチャートデータ */
const radarQuery = createQuery(() => ({
	queryKey: ['user', 'radar', userId],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for radarChart query.');
		}
		return orpc.user.radarChart(userId);
	},
	enabled: Boolean(userId),
}));

/** ヒートマップデータ */
const heatmapQuery = createQuery(() => ({
	queryKey: ['user', 'heatmap', userId],
	queryFn: () => {
		if (!userId) {
			throw new Error('Missing userId for heatmapChart query.');
		}
		return orpc.user.heatmapChart(userId);
	},
	enabled: Boolean(userId),
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

/** 累計pt期間変更ハンドラ */
function handleTotalPtSpanChange(span: string): void {
	totalPtSpan = Number(span) as GraphSpanValue;
}

/** 獲得pt期間変更ハンドラ */
function handleEarnedPtSpanChange(span: string): void {
	earnedPtSpan = Number(span) as GraphSpanValue;
}

/** 投稿タイム期間変更ハンドラ */
function handlePostTimeSpanChange(span: string): void {
	postTimeSpan = Number(span) as GraphSpanValue;
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
	<div class="user-header">
		<div class="user-profile">
			<div class="user-avatar">
				<UserAvatar {userId} alt={username} />
			</div>
			<h1 class="user-username">@{username}</h1>
		</div>
		{#if isOwnProfile}
			<div class="user-settings">
				<Button variant="ghost" size="sm" onclick={openSettings}>
					<IconSettings size={18} />
					設定
				</Button>
			</div>
		{/if}
	</div>

	{#if profileQuery.data}
		<div class="user-content">
			<div class="user-grid">
				<aside class="user-sidebar">
					<RankDisplay
						currentRank={profileQuery.data.currentRank}
						isLoading={profileQuery.isLoading}
					/>
					<RankStatus
						rankStatus={profileQuery.data.rankStatus}
						isLoading={profileQuery.isLoading}
					/>
				</aside>

				<main class="user-main">
					{#if profileQuery.data.statistics}
						<Statistics
							statistics={profileQuery.data.statistics}
							isLoading={profileQuery.isLoading}
						/>
					{/if}

					<div class="user-charts">
						{#if totalPtQuery.data}
							<LineChart
								title="累計pt推移"
								data={totalPtQuery.data.map((d) => ({
									label: d.label,
									value: d.value,
								}))}
								spanOptions={spanOptions}
								currentSpan={String(totalPtSpan)}
								onSpanChange={handleTotalPtSpanChange}
								isLoading={totalPtQuery.isLoading}
								height="10rem"
								showRankBadge
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
								currentSpan={String(earnedPtSpan)}
								onSpanChange={handleEarnedPtSpanChange}
								isLoading={earnedPtQuery.isLoading}
								height="10rem"
								unit="獲得pt"
							/>
						{/if}

						{#if postTimeQuery.data}
							<BarChart
								title="投稿タイム推移"
								data={postTimeQuery.data.map((d) => ({
									label: d.label,
									value: d.value,
								}))}
								spanOptions={spanOptions}
								currentSpan={String(postTimeSpan)}
								onSpanChange={handlePostTimeSpanChange}
								isLoading={postTimeQuery.isLoading}
								height="10rem"
								unit="dt(秒)"
								logScale={true}
								logScaleMin={1}
								logScaleMax={1}
							/>
						{/if}

						<div class="user-charts-row">
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
					</div>
				</main>
			</div>
		</div>
	{:else if userIdQuery.isLoading || profileQuery.isLoading}
		<div class="user-loading">
			<p>読み込み中...</p>
		</div>
	{:else}
		<div class="user-not-found">
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
		padding-bottom: 50px;
		color: #fff;
	}

	.user-header {
		width: 100%;
		margin: 0 auto;
		padding: 40px;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		text-align: center;
	}

	.user-profile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.user-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		overflow: hidden;
	}

	.user-username {
		font-family: 'Lexend', sans-serif;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.user-settings {
		position: absolute;
		top: 12px;
		right: 0;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.85rem;
	}

	.user-content {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.user-grid {
		display: grid;
		grid-template-columns: 16rem 1fr;
		gap: 20px;
		align-items: start;
	}

	.user-sidebar {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.user-main {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.user-charts {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.user-charts-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.user-loading,
	.user-not-found {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		color: #c6c9df;
	}

	@media (max-width: 73.14rem) {
		.user-grid {
			grid-template-columns: 1fr;
		}

		.user-sidebar {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.user-sidebar :global(.rank-display),
		.user-sidebar :global(.status) {
			flex: 1;
			min-width: 14.29rem;
		}
	}

	@media (max-width: 54.86rem) {
		.user-header {
			padding: 2.14rem 0 20px;
		}

		.user-settings {
			position: static;
			margin-top: 0.71rem;
		}

		.user-sidebar {
			flex-direction: column;
		}

		.user-charts-row {
			grid-template-columns: 1fr;
		}
	}
</style>
