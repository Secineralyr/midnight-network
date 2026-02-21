<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import type { EChartsOption } from 'echarts';
import { getRankBadgePath, getRankFromPt } from '$lib/utils/rank';
import Select from '../ui/Select.svelte';
import BaseChart from './BaseChart.svelte';

/**
 * ラインチャートコンポーネント
 * @description 累計pt推移などの折れ線グラフ
 */

/** データポイント */
type DataPoint = {
	/** ラベル */
	label: string;
	/** 値 */
	value: number;
};

interface Props {
	/** タイトル */
	title: string;
	/** データ配列 */
	data: DataPoint[];
	/** 期間選択のオプション */
	spanOptions?: { label: string; value: string }[];
	/** 現在の期間 */
	currentSpan?: string;
	/** 期間変更ハンドラ */
	onSpanChange?: (span: string) => void;
	/** ローディング状態 */
	isLoading?: boolean;
	/** 高さ */
	height?: string;
	/** ランクバッジを表示するか */
	showRankBadge?: boolean;
}

const {
	title,
	data,
	spanOptions = [
		{ label: '日別', value: 'daily' },
		{ label: '週別', value: 'weekly' },
		{ label: '月別', value: 'monthly' },
	],
	currentSpan = 'daily',
	onSpanChange,
	isLoading = false,
	height = '200px',
	showRankBadge = false,
}: Props = $props();

/** チャートオプション */
const chartOptions: EChartsOption = $derived({
	grid: {
		left: 40,
		right: 20,
		top: 20,
		bottom: 30,
	},
	xAxis: {
		type: 'category',
		data: data.map((d) => d.label),
		boundaryGap: false,
	},
	yAxis: {
		type: 'value',
		splitNumber: 4,
	},
	series: [
		{
			type: 'line',
			data: data.map((d) => d.value),
			smooth: true,
			symbol: 'circle',
			symbolSize: 8,
			lineStyle: {
				color: '#A7B1F6',
				width: 2,
			},
			itemStyle: {
				color: '#DCE0FF',
				borderColor: '#ffffff',
				borderWidth: 2,
			},
			areaStyle: {
				color: {
					type: 'linear',
					x: 0,
					y: 0,
					x2: 0,
					y2: 1,
					colorStops: [
						{ offset: 0, color: '#DCE0FF4D' },
						{ offset: 1, color: '#DCE0FF00' },
					],
				},
			},
		},
	],
	tooltip: {
		trigger: 'axis',
		formatter: (params: unknown) => {
			const p = params as { name: string; value: number }[];
			if (p?.[0]) {
				const pt = p[0].value;
				let html = `${p[0].name}<br/>pt: ${pt.toLocaleString()}`;

				if (showRankBadge) {
					const rank = getRankFromPt(pt);
					if (rank !== RankType.NoRank) {
						const badgePath = getRankBadgePath(rank);
						html += `<br/><span style="vertical-align: middle">ランク: </span><img src="${badgePath}" alt="Rank" style="display: inline; width: 24px; height: 24px; vertical-align: middle; margin-top: 4px;" />`;
					}
				}

				return html;
			}
			return '';
		},
	},
});

/**
 * 期間変更ハンドラ
 * @param span - 選択された期間
 */
function handleSpanChange(span: string): void {
	onSpanChange?.(span);
}
</script>

<div class="chart-card">
	<div class="chart-header">
		<h4 class="chart-title">{title}</h4>
		<Select options={spanOptions} value={currentSpan} onchange={handleSpanChange} />
	</div>
	<BaseChart options={chartOptions} {height} {isLoading} />
</div>

<style>
	.chart-card {
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		color: #ffffff;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.chart-title {
		font-size: 1rem;
		font-weight: 600;
	}
</style>
