<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { IconChevronDown } from '@tabler/icons-svelte';
import { cubicOut } from 'svelte/easing';

/**
 * ポップイントランジション
 * フェードイン + スケール + ブラーで前に押し出される感じ
 */
function popIn(_node: Element, { duration = 150 }: { duration?: number } = {}) {
	return {
		duration,
		easing: cubicOut,
		css: (t: number) => {
			const blur = (1 - t) * 6;
			const scale = 0.92 + t * 0.08;
			return `
				opacity: ${t};
				filter: blur(${blur}px);
				transform: scale(${scale});
				transform-origin: top center;
			`;
		},
	};
}

/**
 * セレクトボックスコンポーネント
 * @description ドロップダウン選択UI。アニメーション付き
 */

/** 選択肢の型 */
type SelectOption = {
	/** 表示ラベル */
	label: string;
	/** 値 */
	value: string;
};

interface Props {
	/** 選択肢リスト */
	options: SelectOption[];
	/** 現在の値 */
	value: string;
	/** 値変更ハンドラ */
	onchange?: (value: string) => void;
}

let { options, value = $bindable(), onchange }: Props = $props();

let isOpen = $state(false);
let containerElement: HTMLDivElement | undefined = $state();

/** 現在選択されているオプションのラベル */
const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label || '');

/**
 * ドロップダウンを開閉する
 */
function toggleDropdown(): void {
	isOpen = !isOpen;
}

/**
 * オプションを選択する
 * @param optionValue - 選択した値
 */
function selectOption(optionValue: string): void {
	value = optionValue;
	isOpen = false;
	onchange?.(optionValue);
}

/**
 * 外側クリックでドロップダウンを閉じる
 * @param event - クリックイベント
 */
function handleClickOutside(event: MouseEvent): void {
	if (containerElement && !containerElement.contains(event.target as Node)) {
		isOpen = false;
	}
}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="select" bind:this={containerElement}>
	<button type="button" class="select-trigger" onclick={toggleDropdown} aria-expanded={isOpen}>
		<span class="select-value">{selectedLabel}</span>
		<span class="select-icon">
			<IconChevronDown size={18} />
		</span>
	</button>
	{#if isOpen}
		<div class="select-menu" transition:popIn>
			{#each options as option, i (option.value)}
				<button
					type="button"
					class="select-option"
					class:selected={option.value === value}
					style="--index: {i}"
					onclick={() => selectOption(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.select {
		position: relative;
	}

	.select-trigger {
		padding: 5px 12px;
		background: #2f2d4a;
		border-radius: 4px;
		color: #ffffff;
		font-size: 0.85rem;
		transition: background 0.15s ease;
		display: flex;
		gap: 10px;
	}

	.select-value {
		font-weight: 600;
	}

	.select-trigger:hover {
		background: #35325a;
	}

	.select-icon {
		color: #c6c9df;
		transition: transform 0.2s ease;
		display: inline-flex;
	}

	.select-trigger[aria-expanded='true'] .select-icon {
		transform: rotate(180deg);
	}

	.select-menu {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 100%;
		margin-top: 5px;
		background: #23213a;
		border-radius: 4px;
		overflow: hidden;
		z-index: 9999;
		box-shadow: 0 0px 5px rgba(0, 0, 0, 0.35);
	}

	@keyframes slideInFromLeft {
		from {
			opacity: 0;
			transform: translateX(-8px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.select-option {
		width: 100%;
		padding: 10px;
		text-align: left;
		color: #ffffff;
		font-size: 0.975rem;
		background: transparent;
		cursor: pointer;
		transition: background 0.15s ease;
		white-space: nowrap;
		animation: slideInFromLeft 0.2s ease forwards;
		animation-delay: calc(var(--index) * 30ms);
		opacity: 0;
	}

	.select-option:hover {
		background: #2f2d4a;
	}

	.select-option.selected {
		background: #35325a;
	}
</style>
