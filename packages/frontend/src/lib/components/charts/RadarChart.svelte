<script lang="ts">
import type { RadarResponseT } from '@midnight-network/shared/rpc/user/models';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart.svelte';

/**
 * レーダーチャートコンポーネント
 * @description ユーザーの能力値を表示するレーダーチャート
 */

interface Props {
	/** タイトル */
	title: string;
	/** データ */
	data: RadarResponseT | null;
	/** ローディング状態 */
	isLoading?: boolean;
	/** 高さ */
	height?: string;
}

const { title, data, isLoading = false, height = '300px' }: Props = $props();

/** 正規化されたデータ（0-100スケール） */
const normalizedData = $derived(() => {
	if (!data) {
		return [0, 0, 0, 0, 0];
	}
	return [
		Math.min(100, (data.totalPt / 10000) * 100),
		Math.min(100, data.wr * 100),
		Math.min(100, (1 / Math.max(1, data.averagePlace)) * 100),
		Math.min(100, Math.max(0, 100 - data.averageTime * 10)),
		Math.min(100, (data.totalParticipationCount / 100) * 100),
	];
});

/** チャートオプション */
const chartOptions: EChartsOption = $derived({
	radar: {
		indicator: [
			{ name: '累計pt', max: 100 },
			{ name: 'WR', max: 100 },
			{ name: '順位', max: 100 },
			{ name: 'タイム', max: 100 },
			{ name: '参加回数', max: 100 },
		],
		shape: 'polygon',
		splitNumber: 4,
		axisName: {
			color: '#a0a3b1',
		},
		splitLine: {
			lineStyle: {
				color: '#3d4157',
			},
		},
		splitArea: {
			show: true,
			areaStyle: {
				color: ['rgba(45, 51, 71, 0.3)', 'rgba(37, 42, 61, 0.3)'],
			},
		},
		axisLine: {
			lineStyle: {
				color: '#3d4157',
			},
		},
	},
	series: [
		{
			type: 'radar',
			data: [
				{
					value: normalizedData(),
					name: 'Stats',
					areaStyle: {
						color: 'rgba(197, 201, 230, 0.3)',
					},
					lineStyle: {
						color: '#c5c9e6',
						width: 2,
					},
					itemStyle: {
						color: '#c5c9e6',
					},
				},
			],
		},
	],
});
</script>

<div class="radar-chart card">
	<h4 class="radar-chart__title">{title}</h4>
	<BaseChart options={chartOptions} {height} {isLoading} />
</div>

<style>
	.radar-chart {
		padding: var(--spacing-lg);
	}

	.radar-chart__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}
</style>
