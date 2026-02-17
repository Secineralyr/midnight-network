<script lang="ts">
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';
import { SvelteDate } from 'svelte/reactivity';
import { formatTime } from '$lib/utils/format';

/**
 * Countdown component
 * @description 次の集計までの残り時間を表示
 */

interface Props {
	/** 次の集計時刻（UNIXタイムスタンプ、ミリ秒） */
	targetTime: number;
}

const { targetTime: initialTargetTime }: Props = $props();

const now = new SvelteDate();
let targetTime = $state(initialTargetTime);

function getNextTargetTime(baseTime = Date.now()): number {
	const target = new Date(baseTime);
	target.setUTCHours(Number(import.meta.env.VITE_TARGET_HOUR), Number(import.meta.env.VITE_TARGET_MINUTES), 0, 0);
	if (target.getTime() <= baseTime) {
		target.setUTCDate(target.getUTCDate() + 1);
	}
	return target.getTime();
}

let rafId: number;

function tick(): void {
	const currentTime = Date.now();
	now.setTime(currentTime);
	if (targetTime <= currentTime) {
		targetTime = getNextTargetTime(currentTime);
	}
	rafId = requestAnimationFrame(tick);
}

onMount(() => {
	const currentTime = Date.now();
	now.setTime(currentTime);
	targetTime = getNextTargetTime(currentTime);
	rafId = requestAnimationFrame(tick);

	return () => {
		cancelAnimationFrame(rafId);
	};
});

/** フォーマットされた残り時間 */
const remainingMs = $derived(Math.max(0, targetTime - now.getTime()));
const formattedTime = $derived(formatTime(remainingMs / 1000));
</script>

<div class="root" in:fly={{ y: 10, duration: 400 }}>
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
