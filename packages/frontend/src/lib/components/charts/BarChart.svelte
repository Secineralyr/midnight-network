<script lang="ts">
import type { EChartsOption } from 'echarts';
import Select from '../ui/Select.svelte';
import BaseChart from './BaseChart.svelte';

/**
 * バーチャートコンポーネント
 * @description 獲得pt推移などの棒グラフ
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
	},
	yAxis: {
		type: 'value',
		splitNumber: 4,
	},
	series: [
		{
			type: 'bar',
			data: data.map((d) => d.value),
			barWidth: '60%',
			itemStyle: {
				color: '#c5c9e6',
				borderRadius: [4, 4, 0, 0],
			},
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
				return `${p[0].name}<br/>pt: ${p[0].value >= 0 ? '+' : ''}${p[0].value}`;
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
