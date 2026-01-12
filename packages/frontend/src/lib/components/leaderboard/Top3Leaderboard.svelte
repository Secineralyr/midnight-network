<script lang="ts">
import type { RankTopResponseT, TodayTopResponseT } from '@midnight-network/shared/rpc/models';
import { animate } from 'motion';
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

let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement && !isLoading) {
		animate(containerElement, { opacity: [0, 1] }, { duration: 0.3 });
	}
});

/**
 * ユーザーカードをクリック
 * @param username - ユーザー名
 */
function handleUserClick(username: string): void {
	onUserSelect?.(username);
}
</script>

<div class="top-panel" bind:this={containerElement}>
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
			{#each todayData as item (item.user.userId)}
				<Top3Card
					place={item.place}
					username={item.user.username}
					rank={item.rank}
					time={item.time}
					type="time"
					onclick={() => handleUserClick(item.user.username)}
				/>
			{/each}
		{:else if type === 'rankPt' && rankPtData}
			{#each rankPtData as item (item.user.userId)}
				<Top3Card
					place={item.place}
					username={item.user.username}
					rank={item.rank}
					pt={item.pt}
					type="pt"
					onclick={() => handleUserClick(item.user.username)}
				/>
			{/each}
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
</style>
