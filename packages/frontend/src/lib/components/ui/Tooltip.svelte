<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { fade, fly } from 'svelte/transition';

/**
 * ツールチップコンポーネント
 * @description ホバー時に上からふわっと降りてくるツールチップ
 */

interface Props {
	/** ツールチップに表示するテキスト */
	text: string;
	/** 子要素 */
	children?: import('svelte').Snippet;
}

const { text, children }: Props = $props();

let isVisible = $state(false);

function handleMouseEnter(): void {
	isVisible = true;
}

function handleMouseLeave(): void {
	isVisible = false;
}
</script>

<div
	class="tooltip-wrapper"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	{#if children}
		{@render children()}
	{/if}
	{#if isVisible}
		<div
			class="tooltip"
			role="tooltip"
			in:fly={{ y: 10, duration: 200 }}
			out:fade={{ duration: 150 }}
		>
			{text}
		</div>
	{/if}
</div>

<style>
	.tooltip-wrapper {
		position: relative;
		display: flex;
		justify-content: center;
	}

	.tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 8px;
		padding: 6px 12px;
		background: #35325a;
		color: #ffffff;
		font-size: 0.8rem;
		border-radius: 4px;
		white-space: nowrap;
		z-index: 1000;
		pointer-events: none;
	}
</style>
