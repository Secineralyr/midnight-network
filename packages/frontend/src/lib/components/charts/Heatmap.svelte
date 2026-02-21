<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
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
const gridData = $derived.by(() => {
	if (!data || data.length === 0) {
		return { data: [], rows: 0 };
	}

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
 * @param value - 値（-1: 未参加, 0: フライング, 1以上: 順位）
 * @returns 色
 */
function getColor(value: number): string {
	if (value === -1) {
		return '#2F2D53'; // 未参加
	}
	if (value === 0) {
		return '#BA2E40'; // フライング
	}
	if (value === 1) {
		return '#FEB369'; // 1位
	}
	if (value === 2) {
		return '#CCCCCC'; // 2位
	}
	if (value === 3) {
		return '#C26330'; // 3位
	}
	if (value >= 4 && value <= 10) {
		return '#B8C4FF'; // 4〜10位
	}
	return '#4E4B71'; // それ以外
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
		data: Array.from({ length: gridData.rows }, (_, i) => i.toString()),
		splitArea: { show: false },
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: { show: false },
	},
	series: [
		{
			type: 'heatmap',
			data: gridData.data.map((item) => ({
				value: item,
				itemStyle: {
					color: getColor(item[2]),
				},
			})),
			itemStyle: {
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
	},
	tooltip: {
		formatter: (params: unknown) => {
			const p = params as { data: { value: [number, number, number] } };
			if (!p?.data?.value) {
				return '';
			}
			const value = p.data.value[2];
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
