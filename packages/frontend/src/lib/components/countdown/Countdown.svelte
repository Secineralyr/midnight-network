<script lang="ts">
import { animate } from 'motion';
import { onMount } from 'svelte';
import { formatTime } from '$lib/utils/format';

/**
 * カウントダウンコンポーネント
 * @description 次の集計までの残り時間を表示
 */

interface Props {
	/** 次の集計時刻（UNIXタイムスタンプ、ミリ秒） */
	targetTime: number;
}

const { targetTime }: Props = $props();

let remainingSeconds = $state(0);
let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement) {
		animate(containerElement, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4 });
	}
});

onMount(() => {
	function updateCountdown(): void {
		const now = Date.now();
		const diff = Math.max(0, targetTime - now);
		remainingSeconds = diff / 1000;
	}

	updateCountdown();
	const interval = setInterval(updateCountdown, 1);

	return () => {
		clearInterval(interval);
	};
});

/** フォーマットされた残り時間 */
const formattedTime = $derived(formatTime(remainingSeconds));
</script>

<div class="root" bind:this={containerElement}>
	<h2>次の集計</h2>
	<p>残り時間</p>
	<div>{formattedTime}</div>
	<small>
		※上記タイムはシステム時間です。必ずしも正確ではありません。
	</small>
</div>

<style>
	div > * + * {
		margin-top: 5px;
	}

	div > h2, p, small {
		font-family: 'M PLUS 2', sans-serif;
	}

	div > div {
		font-family: 'Michroma', sans-serif;
	}

	.root {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	h2 {
		font-weight: 600;
		font-size: 2.3rem;
	}

	p {
		font-size: 0.85rem;
	}

	div > div {
		font-size: 2.3rem;
	}

	small {
		font-size: 0.6rem;
		color: #ADADAD;
	}
</style>
