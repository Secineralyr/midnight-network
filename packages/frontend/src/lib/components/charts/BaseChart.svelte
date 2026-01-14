<script lang="ts" generics="T extends EChartsCoreOption">
import type { EChartsCoreOption } from 'echarts';
import * as echarts from 'echarts';
import { onMount } from 'svelte';

/**
 * ベースチャートコンポーネント
 * @description echartsの基底コンポーネント。各チャートはこれを継承
 */

interface Props<T extends EChartsCoreOption> {
	/** チャートオプション */
	options: EChartsCoreOption;
	/** 高さ */
	height?: string;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { options, height = '300px', isLoading = false }: Props<T> = $props();

let chartElement: HTMLDivElement | undefined = $state();
let chartInstance: echarts.ECharts | undefined = $state();

/** ダークテーマの基本設定 */
const darkTheme = {
	backgroundColor: 'transparent',
	textStyle: {
		color: '#ffffff',
		fontFamily: "'Lexend', 'M PLUS 2', sans-serif",
	},
	tooltip: {
		backgroundColor: '#2F2D53',
		borderColor: '#201E3A',
		textStyle: {
			color: '#ffffff',
		},
	},
	xAxis: {
		axisLabel: {
			color: '#ffffff', // ← ここで色を調整
		},
		axisLine: {
			lineStyle: { color: '#ffffff' },
		},
	},
	yAxis: {
		axisLabel: {
			color: '#ffffff', // ← ここで色を調整
		},
		splitLine: {
			lineStyle: { color: '#ffffff' },
		},
	},
};

onMount(() => {
	if (!chartElement) {
		return;
	}

	echarts.registerTheme('midnight', darkTheme);
	chartInstance = echarts.init(chartElement, 'midnight');

	const resizeObserver = new ResizeObserver(() => {
		chartInstance?.resize();
	});
	resizeObserver.observe(chartElement);

	return () => {
		resizeObserver.disconnect();
		chartInstance?.dispose();
	};
});

$effect(() => {
	if (chartInstance && options && !isLoading) {
		chartInstance.setOption(options, true);
	}
});

$effect(() => {
	if (chartInstance) {
		if (isLoading) {
			chartInstance.showLoading({
				text: '',
				color: '#c5c9e6',
				maskColor: 'rgba(20, 18, 32, 0.7)',
			});
		} else {
			chartInstance.hideLoading();
		}
	}
});
</script>

<div class="base-chart" style="height: {height};" bind:this={chartElement}></div>

<style>
	.base-chart {
		width: 100%;
	}
</style>
