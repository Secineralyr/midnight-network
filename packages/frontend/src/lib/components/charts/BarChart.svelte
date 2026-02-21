<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
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
	/** 値の単位（例: 'pt', '円', '%'） */
	unit?: string;
	/** 対数スケールを使用 */
	logScale?: boolean;
	/** 対数スケール時の下限値 */
	logScaleMin?: number;
	/** 対数スケール時の上限値 */
	logScaleMax?: number;
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
	unit = '',
	logScale = false,
	logScaleMin,
	logScaleMax,
}: Props = $props();

/** 値が範囲外かどうかを判定 */
function isOutOfRange(value: number): boolean {
	if (!logScale) {
		return false;
	}
	if (logScaleMin !== undefined && logScaleMax !== undefined && value >= -logScaleMin && value <= logScaleMax) {
		return false;
	}
	if (logScaleMin !== undefined && logScaleMax === undefined && value >= -logScaleMin) {
		return false;
	}
	if (logScaleMax !== undefined && logScaleMin === undefined && value <= logScaleMax) {
		return false;
	}
	return true;
}

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
			data: data.map((d) => ({
				value: logScale ? Math.min(Math.max(d.value, -logScaleMin), logScaleMax) : d.value,
				itemStyle: {
					color:
						d.value === 0
							? '#fff'
							: isOutOfRange(d.value)
								? d.value < 0
									? '#F47D86'
									: '#7E78E4'
								: d.value < 0
									? '#FDBCC1'
									: '#A7B1F6',
				},
			})),
			barWidth: '60%',
			barMinHeight: 5,
		},
	],
	tooltip: {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow',
		},
		formatter: (params: unknown) => {
			const p = params as { name: string; value: number; dataIndex: number }[];
			if (p?.[0]) {
				const originalValue = data[p[0].dataIndex].value;
				const sign = originalValue >= 0 ? '+' : '';
				const unitLabel = unit ? `${unit}: ` : '';
				return `${p[0].name}<br/>${unitLabel}${sign}${originalValue}`;
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
