<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import type { RankHistResponseT } from '@midnight-network/shared/rpc/leaderboard/models';
import type { EChartsOption } from 'echarts';
import { getRankGrade, getRankIconPath, getRankText, type RankTypeValue } from '$lib/utils/rank';
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

/**
 * ランクの色を取得
 * @param rank - ランク値
 * @returns 色コードまたはグラデーションオブジェクト
 */
function getRankColor(rank: RankTypeValue) {
	const grade = getRankGrade(rank);

	// tachyonとluminalはグラデーション
	if (grade === 'tachyon') {
		return {
			type: 'linear',
			x: 0,
			y: 0,
			x2: 1,
			y2: 0,
			colorStops: [
				{ offset: 0, color: '#00CDE8' },
				{ offset: 0.5, color: '#371EC4' },
				{ offset: 1, color: '#6069EB' },
			],
		};
	}

	if (grade === 'luminal') {
		return {
			type: 'linear',
			x: 0,
			y: 0,
			x2: 1,
			y2: 0,
			colorStops: [
				{ offset: 0, color: '#FF9999' },
				{ offset: 0.5, color: '#99CCFF' },
				{ offset: 1, color: '#FFFF99' },
			],
		};
	}

	// その他は単色
	const colorMap: Record<string, string> = {
		gold: '#FFD500',
		silver: '#CCCCCC',
		bronze: '#E69645',
		normal: '#666666',
		beginner: '#A6A6A6',
	};
	return colorMap[grade] || '#000';
}

/**
 * xAxis用のrich設定を生成
 * @returns rich設定オブジェクト
 */
function generateRichConfig(): Record<string, object> {
	const rich: Record<string, object> = {};
	data.forEach((d, index) => {
		const iconPath = d.rank === RankType.NoRank ? '/rank/time/nr.png' : getRankIconPath(d.rank);
		rich[`rank${index}`] = {
			backgroundColor: {
				image: iconPath,
			},
			height: 32,
		};
	});
	return rich;
}

/** チャートオプション */
const chartOptions = $derived({
	grid: {
		left: 60,
		right: 20,
		top: 20,
		bottom: 60,
	},
	xAxis: {
		type: 'category',
		data: data.map((_, index) => index.toString()),
		axisLabel: {
			interval: 0,
			formatter: (_: string, index: number) => {
				return `{rank${index}|}`;
			},
			rich: generateRichConfig(),
		},
		axisTick: {
			show: false,
		},
		axisLine: {
			show: false,
		},
	},
	yAxis: {
		type: 'value',
		splitNumber: 4,
		axisLabel: {
			color: '#fff',
			formatter: (value: number) => `${value.toLocaleString()} %`,
		},
		splitLine: {
			lineStyle: {
				color: '#A7B1F64C',
			},
		},
	},
	series: [
		{
			type: 'bar',
			data: data.map((d) => ({
				value: d.percent,
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
			const p = params as { dataIndex: number; value: number }[];
			if (p?.[0] && data[p[0].dataIndex]) {
				const rankName = getRankText(data[p[0].dataIndex].rank);
				return `${rankName}<br/>${p[0].value.toLocaleString()} %`;
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

<div class="histogram">
	<BaseChart options={chartOptions} {height} {isLoading} />
</div>

<style>
	.histogram {
		padding: 0;
	}
</style>
