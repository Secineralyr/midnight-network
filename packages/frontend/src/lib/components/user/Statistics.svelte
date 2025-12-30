<script lang="ts">
import type { StatisticsT } from '@midnight-network/shared/rpc/user/models';
import { animate } from 'motion';
import { formatAvgTime, formatWinRate } from '$lib/utils/format';

/**
 * 統計コンポーネント
 * @description ユーザーの統計情報を表示
 */

interface Props {
	/** 統計データ */
	statistics: StatisticsT;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { statistics, isLoading = false }: Props = $props();

let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement && !isLoading) {
		animate(containerElement, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3 });
	}
});

/** 統計項目（上段） */
const upperStats = $derived([
	{ label: '参加回数', value: `${statistics.totalParticipationCount}回` },
	{ label: '平均順位', value: `${statistics.averagePlace.toFixed(1)}位` },
	{ label: '最高順位', value: `${statistics.maxPlace}位` },
	{ label: '優勝回数', value: `${statistics.winCount}回` },
	{ label: 'ランクイン回数', value: `${statistics.withinCount}回` },
]);

/** 統計項目（下段） */
const lowerStats = $derived([
	{ label: '平均タイム', value: formatAvgTime(statistics.averageTime) },
	{ label: 'WR', value: formatWinRate(statistics.wr) },
	{ label: '最遅タイム', value: `${statistics.lateTime.toFixed(3)}s` },
	{ label: '最早タイム', value: `${statistics.earlyTime.toFixed(3)}s` },
	{ label: 'フライング回数', value: `${statistics.flyingCount}回` },
]);
</script>

<div class="statistics card" bind:this={containerElement}>
	{#if isLoading}
		<div class="statistics__skeleton">
			{#each Array(10) as _, i (i)}
				<div class="skeleton statistics__skeleton-item"></div>
			{/each}
		</div>
	{:else}
		<div class="statistics__row">
			{#each upperStats as stat (stat.label)}
				<div class="statistics__item">
					<span class="statistics__label">{stat.label}</span>
					<span class="statistics__value font-alphanumeric">{stat.value}</span>
				</div>
			{/each}
		</div>
		<div class="statistics__row">
			{#each lowerStats as stat (stat.label)}
				<div class="statistics__item">
					<span class="statistics__label">{stat.label}</span>
					<span class="statistics__value font-alphanumeric">{stat.value}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.statistics {
		padding: var(--spacing-lg);
	}

	.statistics__row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--spacing-md);
		padding: var(--spacing-md) 0;
	}

	.statistics__row:first-child {
		border-bottom: 1px solid var(--color-border-secondary);
	}

	.statistics__item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.statistics__label {
		font-family: var(--font-japanese);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xs);
	}

	.statistics__value {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	/* スケルトン */
	.statistics__skeleton {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--spacing-md);
	}

	.statistics__skeleton-item {
		height: 48px;
		border-radius: var(--radius-md);
	}

	@media (max-width: 768px) {
		.statistics__row {
			grid-template-columns: repeat(3, 1fr);
		}

		.statistics__skeleton {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 480px) {
		.statistics__row {
			grid-template-columns: repeat(2, 1fr);
		}

		.statistics__skeleton {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
