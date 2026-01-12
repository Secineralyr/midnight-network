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
}

const { title, data, isLoading = false }: Props = $props();
const indicatorLabels = ['累計pt', 'WR', '順位', 'タイム', '参加回数'];

function formatTopPercent(rawValue: number): string {
	const clamped = Math.max(0, Math.min(100, rawValue));
	const topPercent = Math.round(clamped) - 50;
	return `全体平均から${topPercent}%`;
}

function formatItemTooltip(rawValues: number[], index: number): string {
	const rawValue = (rawValues[index] ?? 0) * 100;
	const label = indicatorLabels[index] ?? '';
	return `${label}: ${rawValue.toFixed(0)}%<br/>(${formatTopPercent(rawValue)})`;
}

/** 正規化されたデータ（0-100スケール） */
const rawValues = $derived(() => {
	if (!data) {
		return [0, 0, 0, 0, 0];
	}
	return [
		data.totalPt,
		data.wr,
		data.averagePlace,
		data.averageTime,
		data.totalParticipationCount,
	];
});

const normalizedData = $derived(() =>
	rawValues().map((value) => Math.min(100, value * 100)),
);

const axisTooltipSeries = $derived(() =>
	indicatorLabels.map((label, index): EChartsOption => ({
		type: 'radar',
		name: `${label}-tooltip`,
		data: [
			{
				value: normalizedData().map((value, valueIndex) =>
					valueIndex === index ? value : 0,
				),
			},
		],
		symbol: 'circle',
		symbolSize: 16,
		showSymbol: true,
		lineStyle: { opacity: 0 },
		areaStyle: { opacity: 0 },
		itemStyle: { opacity: 0 },
		tooltip: {
			trigger: 'item',
			formatter: () => formatItemTooltip(rawValues(), index),
		},
	})),
);

/** チャートオプション */
const chartOptions = $derived({
	radar: {
		indicator: indicatorLabels.map((name) => ({ name, max: 100 })),
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
		axisPointer: {
			show: true,
		},
	},
	tooltip: {
		trigger: 'item',
		confine: true,
		appendToBody: true,
	},
	series: [
		{
			type: 'radar',
			symbol: 'circle',
			symbolSize: 6,
			showSymbol: true,
			tooltip: { show: false },
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
		...axisTooltipSeries(),
	],
});
</script>


<div class="chart-card">
	<h4 class="chart-title">{title}</h4>
	<div class="chart-body">
		<BaseChart options={chartOptions} height="100%" {isLoading} />
	</div>
</div>

<style>
	.chart-card {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		color: #ffffff;
	}

	.chart-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.chart-body {
		width: 100%;
		aspect-ratio: 1 / 1;
	}
</style>
