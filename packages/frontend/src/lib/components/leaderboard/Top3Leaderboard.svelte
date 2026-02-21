<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import type { RankTopResponseT, TodayTopResponseT } from '@midnight-network/shared/rpc/models';
import { fade } from 'svelte/transition';
import Top3Card from './Top3Card.svelte';

/**
 * トップ3リーダーボードコンポーネント
 * @description 「今日の試合上位」または「ランクpt上位」を表示
 */

/** リーダーボードのタイプ */
type LeaderboardType = 'today' | 'rankPt';

interface Props {
	/** タイトル */
	title: string;
	/** リーダーボードタイプ */
	type: LeaderboardType;
	/** 今日の上位データ */
	todayData?: TodayTopResponseT;
	/** ランクptの上位データ */
	rankPtData?: RankTopResponseT;
	/** ローディング状態 */
	isLoading?: boolean;
	/** ユーザー選択ハンドラ */
	onUserSelect?: (username: string) => void;
}

const { title, type, todayData, rankPtData, isLoading = false, onUserSelect }: Props = $props();

/**
 * ユーザーカードをクリック
 * @param username - ユーザー名
 */
function handleUserClick(username: string): void {
	onUserSelect?.(username);
}
</script>

<div class="top-panel">
	<h3 class="top-title">{title}</h3>
	<div class="top-list">
		{#if isLoading}
			{#each [1, 2, 3] as index (index)}
				<Top3Card
					place={index}
					username=""
					rank={0}
					type={type === 'today' ? 'time' : 'pt'}
					isLoading={true}
				/>
			{/each}
		{:else if type === 'today' && todayData}
			<div class="top-cards" in:fade={{ duration: 300 }}>
				{#each todayData as item (item.user.userId)}
					<Top3Card
						place={item.place}
						userId={item.user.userId}
						username={item.user.username}
						rank={item.rank}
						time={item.time}
						type="time"
						onclick={() => handleUserClick(item.user.username)}
					/>
				{/each}
			</div>
		{:else if type === 'rankPt' && rankPtData}
			<div class="top-cards" in:fade={{ duration: 300 }}>
				{#each rankPtData as item (item.user.userId)}
					<Top3Card
						place={item.place}
						userId={item.user.userId}
						username={item.user.username}
						rank={item.rank}
						pt={item.pt}
						type="pt"
						onclick={() => handleUserClick(item.user.username)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.top-panel {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		width: 100%;
	}

	.top-title {
		font-size: 1.15rem;
		font-weight: 600;
		color: #fff;
	}

	.top-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.top-cards {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.top-panel {
			padding: 15px;
			gap: 15px;
		}
		.top-title {
			font-size: 1rem;
		}
		.top-list {
			gap: 8px;
		}
		.top-cards {
			gap: 8px;
		}
	}
</style>
