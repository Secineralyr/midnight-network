<script lang="ts">
import type { LastResultResponseT } from '@midnight-network/shared/rpc/me/models';
import { RankShiftType } from '@midnight-network/shared/rpc/me/models';
import { animate } from 'motion';
import { formatDate, formatPlace, formatPt, formatTimeDiff } from '$lib/utils/format';
import RankIcon from '../rank/RankIcon.svelte';

/**
 * 前回のリザルトコンポーネント
 * @description ログインユーザーの前回の試合結果を表示
 */

interface Props {
	/** リザルトデータ */
	result: NonNullable<LastResultResponseT>;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { result, isLoading = false }: Props = $props();

let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement && !isLoading) {
		animate(containerElement, { opacity: [0, 1], y: [20, 0] }, { duration: 0.4 });
	}
});

/** ランクアップ判定 */
const isRankUp = $derived(result.rankShift === RankShiftType.RankUp);

/** ランクダウン判定 */
const isRankDown = $derived(result.rankShift === RankShiftType.RankDown);
</script>

<div class="last-result card" bind:this={containerElement}>
	{#if isLoading}
		<div class="last-result__skeleton">
			<div class="skeleton last-result__skeleton-title"></div>
			<div class="skeleton last-result__skeleton-content"></div>
		</div>
	{:else}
		<div class="last-result__header">
			<h3 class="last-result__title">前回のリザルト</h3>
			<span class="last-result__date font-alphanumeric"
				>({formatDate(result.targetDate)})</span
			>
		</div>
		<div class="last-result__content">
			<div class="last-result__stats">
				<div class="last-result__stat">
					<span class="last-result__stat-label">順位</span>
					<span class="last-result__stat-value last-result__stat-value--place font-alphanumeric">
						{result.place}
					</span>
				</div>
				<div class="last-result__stat">
					<span class="last-result__stat-label">タイム</span>
					<span class="last-result__stat-value font-alphanumeric">
						{formatTimeDiff(result.time)}
					</span>
				</div>
				<div class="last-result__stat">
					<span class="last-result__stat-label">獲得pt</span>
					<span class="last-result__stat-value font-alphanumeric">
						{result.earnedPt >= 0 ? '+' : ''}{result.earnedPt}
					</span>
				</div>
				<div class="last-result__total">
					<span class="last-result__total-value font-alphanumeric">
						= {formatPt(result.latestTotalPt)}
					</span>
					{#if isRankUp}
						<span class="last-result__rank-shift last-result__rank-shift--up">
							Rank up!
						</span>
					{:else if isRankDown}
						<span class="last-result__rank-shift last-result__rank-shift--down">
							Rank down
						</span>
					{/if}
				</div>
			</div>
			<div class="last-result__rank">
				<RankIcon rank={result.latestRank} size="lg" />
			</div>
		</div>
	{/if}
</div>

<style>
	.last-result {
		padding: var(--spacing-lg);
	}

	.last-result__header {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.last-result__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.last-result__date {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.last-result__content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.last-result__stats {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.last-result__stat {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-md);
	}

	.last-result__stat-label {
		font-family: var(--font-japanese);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		min-width: 60px;
	}

	.last-result__stat-value {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.last-result__stat-value--place {
		color: var(--color-accent-success);
	}

	.last-result__total {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	.last-result__total-value {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.last-result__rank-shift {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
	}

	.last-result__rank-shift--up {
		color: var(--color-accent-success);
	}

	.last-result__rank-shift--down {
		color: var(--color-accent-error);
	}

	.last-result__rank {
		flex-shrink: 0;
	}

	/* スケルトン */
	.last-result__skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.last-result__skeleton-title {
		width: 200px;
		height: 28px;
		border-radius: var(--radius-md);
	}

	.last-result__skeleton-content {
		width: 100%;
		height: 120px;
		border-radius: var(--radius-md);
	}

	@media (max-width: 768px) {
		.last-result__content {
			flex-direction: column;
			align-items: flex-start;
		}

		.last-result__rank {
			align-self: center;
		}
	}
</style>
