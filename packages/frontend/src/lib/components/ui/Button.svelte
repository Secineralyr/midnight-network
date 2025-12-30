<script lang="ts">
import { animate } from 'motion';

/**
 * ボタンコンポーネント
 * @description 共通ボタンUI。ホバー・クリック時のアニメーション付き
 */

/** ボタンのバリアント */
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** ボタンのサイズ */
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
	/** ボタンのバリアント */
	variant?: ButtonVariant;
	/** ボタンのサイズ */
	size?: ButtonSize;
	/** 無効状態 */
	disabled?: boolean;
	/** ボタンタイプ */
	type?: 'button' | 'submit' | 'reset';
	/** クリックハンドラ */
	onclick?: (event: MouseEvent) => void;
	/** 子要素 */
	children?: import('svelte').Snippet;
}

const { variant = 'primary', size = 'md', disabled = false, type = 'button', onclick, children }: Props = $props();

let buttonElement: HTMLButtonElement | undefined = $state();

/**
 * ホバー開始時のアニメーション
 */
function handleMouseEnter(): void {
	if (buttonElement && !disabled) {
		animate(buttonElement, { scale: 1.02 }, { duration: 0.15 });
	}
}

/**
 * ホバー終了時のアニメーション
 */
function handleMouseLeave(): void {
	if (buttonElement && !disabled) {
		animate(buttonElement, { scale: 1 }, { duration: 0.15 });
	}
}

/**
 * クリック時のアニメーション
 */
function handleClick(event: MouseEvent): void {
	if (buttonElement && !disabled) {
		animate(buttonElement, { scale: [1, 0.95, 1] }, { duration: 0.2 });
	}
	onclick?.(event);
}
</script>

<button
	bind:this={buttonElement}
	class="button button--{variant} button--{size}"
	class:button--disabled={disabled}
	{type}
	{disabled}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		font-family: var(--font-japanese);
		font-weight: var(--font-weight-medium);
		border-radius: var(--radius-lg);
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
		cursor: pointer;
		white-space: nowrap;
	}

	/* バリアント: primary */
	.button--primary {
		background-color: var(--color-bg-card);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border-primary);
	}

	.button--primary:hover:not(.button--disabled) {
		background-color: var(--color-bg-card-hover);
		border-color: var(--color-border-focus);
	}

	/* バリアント: secondary */
	.button--secondary {
		background-color: transparent;
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border-secondary);
	}

	.button--secondary:hover:not(.button--disabled) {
		background-color: var(--color-bg-card);
		color: var(--color-text-primary);
	}

	/* バリアント: ghost */
	.button--ghost {
		background-color: transparent;
		color: var(--color-text-secondary);
		border: none;
	}

	.button--ghost:hover:not(.button--disabled) {
		background-color: var(--color-bg-card);
		color: var(--color-text-primary);
	}

	/* サイズ: sm */
	.button--sm {
		padding: var(--spacing-xs) var(--spacing-md);
		font-size: var(--font-size-sm);
		min-height: 32px;
	}

	/* サイズ: md */
	.button--md {
		padding: var(--spacing-sm) var(--spacing-lg);
		font-size: var(--font-size-base);
		min-height: 40px;
	}

	/* サイズ: lg */
	.button--lg {
		padding: var(--spacing-md) var(--spacing-xl);
		font-size: var(--font-size-lg);
		min-height: 48px;
	}

	/* 無効状態 */
	.button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
