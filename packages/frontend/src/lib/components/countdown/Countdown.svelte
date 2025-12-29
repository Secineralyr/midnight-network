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
	const interval = setInterval(updateCountdown, 100);

	return () => {
		clearInterval(interval);
	};
});

/** フォーマットされた残り時間 */
const formattedTime = $derived(formatTime(remainingSeconds));
</script>

<div class="countdown" bind:this={containerElement}>
	<h2 class="countdown__title">次の集計</h2>
	<span class="countdown__subtitle">残り時間</span>
	<div class="countdown__time font-alphanumeric">{formattedTime}</div>
	<p class="countdown__note">
		※上記タイムはシステム時間です。必ずしも正確ではありません。
	</p>
</div>

<style>
	.countdown {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	.countdown__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.countdown__subtitle {
		font-family: var(--font-japanese);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
	}

	.countdown__time {
		font-size: var(--font-size-5xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		letter-spacing: 0.05em;
		margin-bottom: var(--spacing-md);
	}

	.countdown__note {
		font-family: var(--font-japanese);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	@media (max-width: 768px) {
		.countdown__time {
			font-size: var(--font-size-3xl);
		}
	}
</style>
