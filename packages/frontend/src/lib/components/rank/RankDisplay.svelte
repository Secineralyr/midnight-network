<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import type { CurrentRankT } from '@midnight-network/shared/rpc/user/models';
import { animate } from 'motion';
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

let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement && !isLoading) {
		animate(containerElement, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3 });
	}
});

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
	const pt = currentRank.nextRankPt;
	if (pt >= 0) {
		return 0;
	}
	return Math.min(100, Math.max(0, ((1000 + pt) / 1000) * 100));
});
</script>

<div class="rank-display" bind:this={containerElement}>
	{#if isLoading}
		<div class="rank-display__skeleton">
			<div class="skeleton rank-display__skeleton-icon"></div>
			<div class="skeleton rank-display__skeleton-bar"></div>
		</div>
	{:else}
		<h3 class="rank-display__title">現在ランク</h3>
		<div class="rank-display__icon">
			<RankIcon rank={rankValue} size="xl" />
		</div>
		{#if !isNoRank && 'nextRankPt' in currentRank}
			<div class="rank-display__progress">
				<span class="rank-display__label">次のランクまで</span>
				<div class="rank-display__bar">
					<div class="rank-display__bar-fill" style="width: {progressPercent()}%"></div>
					<span class="rank-display__bar-text">{nextRankPtText()}</span>
				</div>
			</div>
		{:else if isNoRank && 'remainingParticipationCount' in currentRank}
			<div class="rank-display__norank">
				<span class="rank-display__label">ランク取得まで残り</span>
				<span class="rank-display__count"
					>{currentRank.remainingParticipationCount}回参加</span
				>
			</div>
		{/if}
	{/if}
</div>

<style>
	.rank-display {
		padding: var(--spacing-lg);
	}

	.rank-display__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-lg);
	}

	.rank-display__icon {
		display: flex;
		justify-content: center;
		margin-bottom: var(--spacing-xl);
	}

	.rank-display__progress {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.rank-display__label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.rank-display__bar {
		position: relative;
		height: 32px;
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.rank-display__bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background-color: var(--color-accent-primary);
		border-radius: var(--radius-lg);
		transition: width var(--transition-normal);
	}

	.rank-display__bar-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: var(--font-alphanumeric);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
	}

	.rank-display__norank {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		text-align: center;
	}

	.rank-display__count {
		font-family: var(--font-alphanumeric);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	/* スケルトン */
	.rank-display__skeleton {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.rank-display__skeleton-icon {
		width: 120px;
		height: 120px;
		border-radius: var(--radius-lg);
	}

	.rank-display__skeleton-bar {
		width: 100%;
		height: 32px;
		border-radius: var(--radius-lg);
	}
</style>
