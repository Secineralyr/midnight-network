<script lang="ts">
import type { RankHistResponseT } from '@midnight-network/shared/rpc/leaderboard/models';
import type { EChartsOption } from 'echarts';
import { getRankGrade, getRankText, type RankTypeValue } from '$lib/utils/rank';
import Select from '../ui/Select.svelte';
import BaseChart from './BaseChart.svelte';

/**
 * ランクヒストグラムコンポーネント
 * @description ランク分布を表示するヒストグラム
 */

/** 順位基準のオプション */
type SortCriteria = 'rank' | 'wr' | 'avgTime' | 'matchTime';

interface Props {
	/** データ */
	data: RankHistResponseT;
	/** 順位基準 */
	sortBy?: SortCriteria;
	/** 順位基準変更ハンドラ */
	onSortChange?: (criteria: SortCriteria) => void;
	/** ローディング状態 */
	isLoading?: boolean;
	/** 高さ */
	height?: string;
}

const { data, sortBy = 'rank', onSortChange, isLoading = false, height = '200px' }: Props = $props();

/** ソートオプション */
const sortOptions = [
	{ label: 'ランク', value: 'rank' },
	{ label: 'WR', value: 'wr' },
	{ label: '平均タイム', value: 'avgTime' },
	{ label: '今日のタイム', value: 'matchTime' },
];

/**
 * ランクの色を取得
 * @param rank - ランク値
 * @returns 色コード
 */
function getRankColor(rank: RankTypeValue): string {
	const grade = getRankGrade(rank);
	const colorMap: Record<string, string> = {
		tachyon: '#00d4ff',
		luminal: '#ff6b9d',
		gold: '#ffd700',
		silver: '#c0c0c0',
		bronze: '#cd7f32',
		normal: '#808080',
		beginner: '#f5f5f5',
		norank: '#4a4a4a',
	};
	return colorMap[grade] || '#808080';
}

/** チャートオプション */
const chartOptions: EChartsOption = $derived({
	grid: {
		left: 80,
		right: 20,
		top: 20,
		bottom: 60,
	},
	xAxis: {
		type: 'category',
		data: data.map((d) => getRankText(d.rank)),
		axisLabel: {
			rotate: 0,
			interval: 0,
		},
	},
	yAxis: {
		type: 'value',
		name: 'player',
		nameLocation: 'middle',
		nameGap: 50,
		splitNumber: 4,
		axisLabel: {
			formatter: (value: number) => `${value.toLocaleString()} player`,
		},
	},
	series: [
		{
			type: 'bar',
			data: data.map((d) => ({
				value: d.percent * 1000,
				itemStyle: {
					color: getRankColor(d.rank),
				},
			})),
			barWidth: '70%',
		},
	],
	tooltip: {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow',
		},
		formatter: (params: unknown) => {
			const p = params as { name: string; value: number }[];
			if (p?.[0]) {
				return `${p[0].name}<br/>${p[0].value.toLocaleString()} player`;
			}
			return '';
		},
	},
});

/**
 * ソート変更ハンドラ
 * @param criteria - 選択された基準
 */
function handleSortChange(criteria: string): void {
	onSortChange?.(criteria as SortCriteria);
}
</script>

<div class="rank-histogram">
	<div class="rank-histogram__header">
		<span class="rank-histogram__label">順位基準</span>
		<Select options={sortOptions} value={sortBy} onchange={handleSortChange} />
	</div>
	<BaseChart options={chartOptions} {height} {isLoading} />
</div>

<style>
	.rank-histogram {
		padding: var(--spacing-lg);
	}

	.rank-histogram__header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.rank-histogram__label {
		font-family: var(--font-japanese);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
