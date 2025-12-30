<script lang="ts">
import type { EChartsOption } from 'echarts';
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
				color: '#c5c9e6',
				width: 2,
			},
			itemStyle: {
				color: '#c5c9e6',
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
						{ offset: 0, color: 'rgba(197, 201, 230, 0.3)' },
						{ offset: 1, color: 'rgba(197, 201, 230, 0)' },
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
				return `${p[0].name}<br/>pt: ${p[0].value.toLocaleString()}`;
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

<div class="line-chart card">
	<div class="line-chart__header">
		<h4 class="line-chart__title">{title}</h4>
		<Select options={spanOptions} value={currentSpan} onchange={handleSpanChange} />
	</div>
	<BaseChart options={chartOptions} {height} {isLoading} />
</div>

<style>
	.line-chart {
		padding: var(--spacing-lg);
	}

	.line-chart__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-md);
	}

	.line-chart__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}
</style>
