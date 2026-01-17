<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import type { CurrentRankT } from '@midnight-network/shared/rpc/user/models';
import { fly } from 'svelte/transition';
import GaugeBar from '$lib/components/ui/GaugeBar.svelte';
import { formatPt } from '$lib/utils/format';
import RankIcon from './RankIcon.svelte';

/**
 * ランク表示コンポーネント
 * @description 現在ランク、次のランクまでのpt、プログレスバーを表示
 */

interface Props {
	/** 現在のランク情報 */
	currentRank: CurrentRankT;
	/** スケルトン表示 */
	isLoading?: boolean;
}

const { currentRank, isLoading = false }: Props = $props();

/** ランク数値を取得 */
const rankValue = $derived(currentRank.rank);

/** NoRank判定 */
const isNoRank = $derived(rankValue === RankType.NoRank);

/** 次のランクまでのpt表示 */
const nextRankPtText = $derived(() => {
	if (isNoRank) {
		return '';
	}
	if ('nextRankPt' in currentRank) {
		return formatPt(currentRank.nextRankPt);
	}
	return '';
});

/** プログレスバーの幅（0-100%） */
const progressPercent = $derived(() => {
	if (isNoRank || !('nextRankPt' in currentRank)) {
		return 0;
	}
	return (1 - currentRank.nextRankPt / 500) * 100;
});
</script>

<div class="rank-display" in:fly={{ y: 10, duration: 300 }}>
	<h3 class="rank-display-title" class:skeleton={isLoading}>
		{#if !isLoading}現在ランク{/if}
	</h3>
	<div class="rank-display-icon" class:skeleton={isLoading}>
		{#if !isLoading}<RankIcon rank={rankValue} />{/if}
	</div>
	{#if isLoading}
		<div class="rank-display-progress">
			<span class="rank-display-label skeleton">&nbsp;</span>
			<div class="rank-display-gauge skeleton"></div>
		</div>
	{:else if !isNoRank && 'nextRankPt' in currentRank}
		<div class="rank-display-progress">
			<span class="rank-display-label">次のランクまで</span>
			<GaugeBar value={progressPercent()} text={nextRankPtText()} />
		</div>
	{:else if isNoRank && 'remainingParticipationCount' in currentRank}
		<div class="rank-display-norank">
			<span class="rank-display-label">ランク取得まで残り</span>
			<span class="rank-display-count">{currentRank.remainingParticipationCount}回</span>
		</div>
	{/if}
</div>

<style>
	.rank-display {
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		color: #ffffff;
	}

	.rank-display-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 10px;
	}

	.rank-display-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
		margin-top: 20px;
		padding: 0 40px;
	}

	.rank-display-progress {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.rank-display-label {
		font-size: 0.86rem;
		color: #fff;
	}

	.rank-display-norank {
		display: flex;
		flex-direction: column;
		gap: 20px;
		text-align: center;
	}

	.rank-display-count {
		font-size: 1rem;
		font-weight: 600;
	}

	.rank-display-gauge {
		height: 28px;
		border-radius: 5px;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.rank-display-title {
			font-size: 0.9rem;
		}
		.rank-display-icon {
			margin-bottom: 15px;
			margin-top: 15px;
			height: 150px;
			padding: 0;
		}
		.rank-display-label {
			font-size: 0.8rem;
		}
		.rank-display-count {
			font-size: 0.9rem;
		}
	}
</style>
