<script lang="ts">
import type { StatisticsT } from '@midnight-network/shared/rpc/user/models';
import { fly } from 'svelte/transition';
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

/** 統計項目（上段） */
const upperStats = $derived([
	{ label: '総参加回数', value: `${statistics.totalParticipationCount}回` },
	{ label: '平均順位', value: `${statistics.averagePlace.toFixed(1)}位` },
	{ label: '最高順位', value: `${statistics.maxPlace}位` },
	{ label: '1位獲得回数', value: `${statistics.winCount}回` },
	{ label: 'ランクイン回数', value: `${statistics.withinCount}回` },
]);

/** 統計項目（下段） */
const lowerStats = $derived([
	{ label: '平均タイム', value: formatAvgTime(statistics.averageTime) },
	{ label: 'WR', value: formatWinRate(statistics.wr) },
	{ label: '最遅タイム', value: `${(statistics.lateTime / 1000).toFixed(3)}s` },
	{ label: '最早タイム', value: `${(statistics.earlyTime / 1000).toFixed(3)}s` },
	{ label: 'フライング回数', value: `${statistics.flyingCount}回` },
]);
</script>

{#if !isLoading}
	<div class="stats" in:fly={{ y: 10, duration: 300 }}>
		<h3 class="stats-title">統計データ</h3>
		<div class="stats-row">
			{#each upperStats as stat (stat.label)}
				<div class="stats-item">
					<span class="stats-label">{stat.label}</span>
					<span class="stats-value">{stat.value}</span>
				</div>
			{/each}
		</div>
		<div class="stats-row">
			{#each lowerStats as stat (stat.label)}
				<div class="stats-item">
					<span class="stats-label">{stat.label}</span>
					<span class="stats-value">{stat.value}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

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
</style>
