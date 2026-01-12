<script lang="ts">
import type { HeatmapResponseT } from '@midnight-network/shared/rpc/user/models';
import { HeatmapType } from '@midnight-network/shared/rpc/user/models';
import type { EChartsOption } from 'echarts';
import BaseChart from './BaseChart.svelte';

/**
 * ヒートマップコンポーネント
 * @description 参加履歴のヒートマップ
 */

interface Props {
	/** タイトル */
	title: string;
	/** データ */
	data: HeatmapResponseT;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { title, data, isLoading = false }: Props = $props();

/** 7列 x N行のグリッドデータを生成 */
const gridData = $derived(() => {
	const result: [number, number, number][] = [];
	const cols = 7;
	const rows = Math.ceil(data.length / cols);

	data.forEach((item, index) => {
		const x = index % cols;
		const y = Math.floor(index / cols);
		let value = 0;

		if (item.type === HeatmapType.NoParticipation) {
			value = -1;
		} else if (item.type === HeatmapType.Flying) {
			value = 0;
		} else if (item.type === HeatmapType.Participation && 'place' in item) {
			value = item.place;
		}

		result.push([x, y, value]);
	});

	return { data: result, rows };
});

/**
 * 値から色を取得
 * @param value - 値
 * @returns 色
 */
function getColor(value: number): string {
	if (value === -1) {
		return '#252a3d';
	}
	if (value === 0) {
		return '#ef4444';
	}
	if (value <= 3) {
		return '#c5c9e6';
	}
	if (value <= 10) {
		return '#8b8fad';
	}
	if (value <= 50) {
		return '#fbbf24';
	}
	return '#6b6f7e';
}

/** チャートオプション */
const chartOptions: EChartsOption = $derived({
	grid: {
		left: 10,
		right: 10,
		top: 10,
		bottom: 10,
	},
	xAxis: {
		type: 'category',
		data: ['日', '月', '火', '水', '木', '金', '土'],
		splitArea: { show: false },
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: { show: false },
	},
	yAxis: {
		type: 'category',
		data: Array.from({ length: gridData().rows }, (_, i) => i.toString()),
		splitArea: { show: false },
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: { show: false },
	},
	series: [
		{
			type: 'heatmap',
			data: gridData().data,
			itemStyle: {
				borderRadius: 4,
				borderWidth: 2,
				borderColor: '#1a1d2e',
			},
			emphasis: {
				itemStyle: {
					borderColor: '#c5c9e6',
				},
			},
		},
	],
	visualMap: {
		show: false,
		min: -1,
		max: 100,
		inRange: {
			color: ['#252a3d', '#ef4444', '#c5c9e6', '#8b8fad', '#fbbf24', '#6b6f7e'],
		},
	},
	tooltip: {
		formatter: (params: unknown) => {
			const p = params as { data: [number, number, number] };
			if (!p?.data) {
				return '';
			}
			const value = p.data[2];
			if (value === -1) {
				return '未参加';
			}
			if (value === 0) {
				return 'フライング';
			}
			return `${value}位`;
		},
	},
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
