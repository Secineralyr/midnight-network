<script lang="ts">
import type { StatisticsT } from '@midnight-network/shared/rpc/user/models';
import { fly } from 'svelte/transition';
import { formatAvgTime, formatWinRate } from '$lib/utils/format';
import Tooltip from '$lib/components/ui/Tooltip.svelte';

/** 統計項目の型 */
type StatItem = {
	label: string;
	value: string;
	tooltip: string;
};

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

/** 統計項目（上段） */
const upperStats = $derived([
	{ label: '総参加回数', value: `${statistics.totalParticipationCount}回`, tooltip: '試合に何回参加したか' },
	{ label: '平均順位', value: `${statistics.averagePlace.toFixed(1)}位`, tooltip: 'フライングではない場合の平均順位' },
	{ label: '最高順位', value: `${statistics.maxPlace}位`, tooltip: '過去に取った最高順位' },
	{ label: '1位獲得回数', value: `${statistics.winCount}回`, tooltip: '試合で1位を獲得した回数' },
	{ label: 'ランクイン回数', value: `${statistics.withinCount}回`, tooltip: '1～10位を獲得した回数' },
]);

/** 統計項目（下段） */
const lowerStats = $derived([
	{ label: '平均タイム', value: formatAvgTime(statistics.averageTime), tooltip: 'フライングを含まない過去投稿時間の平均' },
	{ label: 'WR', value: formatWinRate(statistics.wr), tooltip: '1位獲得レート' },
	{ label: '最遅タイム', value: `${(statistics.lateTime / 1000).toFixed(3)}s`, tooltip: '過去で一番遅い投稿時間' },
	{ label: '最早タイム', value: `${(statistics.earlyTime / 1000).toFixed(3)}s`, tooltip: '過去で一番早い投稿時間' },
	{ label: 'フライング回数', value: `${statistics.flyingCount}回`, tooltip: '過去何回フライングしたか' },
]);
</script>

<div class="stats" in:fly={{ y: 10, duration: 300 }}>
	<h3 class="stats-title" class:skeleton={isLoading}>
		{#if !isLoading}統計データ{/if}
	</h3>
	<div class="stats-row">
		{#each isLoading ? Array(5) : upperStats as stat, i (isLoading ? i : stat.label)}
			<Tooltip text={isLoading ? '' : (stat as StatItem).tooltip}>
				<div class="stats-item">
					<span class="stats-label" class:skeleton={isLoading}>
						{#if !isLoading}{(stat as StatItem).label}{/if}
					</span>
					<span class="stats-value" class:skeleton={isLoading}>
						{#if !isLoading}{(stat as StatItem).value}{/if}
					</span>
				</div>
			</Tooltip>
		{/each}
	</div>
	<div class="stats-row">
		{#each isLoading ? Array(5) : lowerStats as stat, i (isLoading ? i : stat.label)}
			<Tooltip text={isLoading ? '' : (stat as StatItem).tooltip}>
				<div class="stats-item">
					<span class="stats-label" class:skeleton={isLoading}>
						{#if !isLoading}{(stat as StatItem).label}{/if}
					</span>
					<span class="stats-value" class:skeleton={isLoading}>
						{#if !isLoading}{(stat as StatItem).value}{/if}
					</span>
				</div>
			</Tooltip>
		{/each}
	</div>
</div>

<style>
	.stats {
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		color: #ffffff;
	}

	.stats-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 10px;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 20px;
	}

	.stats-row + .stats-row {
		margin-top: 20px;
	}

	.stats-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 5px;
	}

	.stats-label {
		font-size: 0.86rem;
		color: #fff;
	}

	.stats-value {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.stats {
			padding: 15px;
		}
		.stats-title {
			font-size: 0.9rem;
		}
		.stats-row {
			grid-template-columns: repeat(3, 1fr);
			gap: 15px;
		}
		.stats-row + .stats-row {
			margin-top: 15px;
		}
		.stats-label {
			font-size: 0.75rem;
		}
		.stats-value {
			font-size: 0.85rem;
		}
	}

	/* 狭い幅（500px未満） */
	@media (max-width: 499px) {
		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
