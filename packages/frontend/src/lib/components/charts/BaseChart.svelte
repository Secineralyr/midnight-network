<script lang="ts">
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { onMount } from 'svelte';

/**
 * ベースチャートコンポーネント
 * @description echartsの基底コンポーネント。各チャートはこれを継承
 */

interface Props {
	/** チャートオプション */
	options: EChartsOption;
	/** 高さ */
	height?: string;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { options, height = '300px', isLoading = false }: Props = $props();

let chartElement: HTMLDivElement | undefined = $state();
let chartInstance: echarts.ECharts | undefined = $state();

/** ダークテーマの基本設定 */
const darkTheme = {
	backgroundColor: 'transparent',
	textStyle: {
		color: '#a0a3b1',
		fontFamily: "'Lexend', 'M PLUS 2', sans-serif",
	},
	title: {
		textStyle: {
			color: '#ffffff',
		},
	},
	legend: {
		textStyle: {
			color: '#a0a3b1',
		},
	},
	tooltip: {
		backgroundColor: '#252a3d',
		borderColor: '#3d4157',
		textStyle: {
			color: '#ffffff',
		},
	},
	xAxis: {
		axisLine: {
			lineStyle: {
				color: '#3d4157',
			},
		},
		axisLabel: {
			color: '#a0a3b1',
		},
		splitLine: {
			lineStyle: {
				color: '#2d3347',
			},
		},
	},
	yAxis: {
		axisLine: {
			lineStyle: {
				color: '#3d4157',
			},
		},
		axisLabel: {
			color: '#a0a3b1',
		},
		splitLine: {
			lineStyle: {
				color: '#2d3347',
			},
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
				maskColor: 'rgba(13, 15, 26, 0.8)',
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
