<script lang="ts">
import { IconChevronDown } from '@tabler/icons-svelte';
import { animate } from 'motion';

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
	/** ラベル */
	label?: string;
	/** 値変更ハンドラ */
	onchange?: (value: string) => void;
}

let { options, value = $bindable(), label, onchange }: Props = $props();

let isOpen = $state(false);
let containerElement: HTMLDivElement | undefined = $state();
let dropdownElement: HTMLDivElement | undefined = $state();

/** 現在選択されているオプションのラベル */
const selectedLabel = $derived(options.find((opt) => opt.value === value)?.label || '');

/**
 * ドロップダウンを開閉する
 */
function toggleDropdown(): void {
	isOpen = !isOpen;
	if (dropdownElement) {
		if (isOpen) {
			animate(dropdownElement, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.2 });
		}
	}
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
	{#if label}
		<span class="select__label">{label}</span>
	{/if}
	<button type="button" class="select__trigger" onclick={toggleDropdown} aria-expanded={isOpen}>
		<span class="select__value">{selectedLabel}</span>
		<span class="select__icon">
			<IconChevronDown size={20} />
		</span>
	</button>
	{#if isOpen}
		<div class="select__dropdown" bind:this={dropdownElement}>
			{#each options as option (option.value)}
				<button
					type="button"
					class="select__option"
					class:select__option--selected={option.value === value}
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
		display: inline-flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.select__label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.select__trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-lg);
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		min-width: 120px;
		cursor: pointer;
		transition: border-color var(--transition-fast);
	}

	.select__trigger:hover {
		border-color: var(--color-border-focus);
	}

	.select__value {
		font-family: var(--font-japanese);
	}

	.select__icon {
		color: var(--color-text-secondary);
		transition: transform var(--transition-fast);
	}

	.select__trigger[aria-expanded='true'] .select__icon {
		transform: rotate(180deg);
	}

	.select__dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: var(--spacing-xs);
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		z-index: var(--z-dropdown);
	}

	.select__option {
		display: block;
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		text-align: left;
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		font-family: var(--font-japanese);
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.select__option:hover {
		background-color: var(--color-bg-card-hover);
	}

	.select__option--selected {
		background-color: var(--color-bg-secondary);
	}
</style>
