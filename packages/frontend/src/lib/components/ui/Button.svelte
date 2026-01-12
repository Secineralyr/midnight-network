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
	class={`btn ${variant} ${size}`}
	class:disabled={disabled}
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
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border-radius: 4px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
		white-space: nowrap;
	}

	.btn.primary {
		background: #201E3A;
		color: #ffffff;
	}

	.btn.primary:hover:not(.disabled) {
		background: #35325a;
	}

	.btn.secondary {
		background: transparent;
		color: #c6c9df;
		border: 1px solid #3b3854;
	}

	.btn.secondary:hover:not(.disabled) {
		color: #ffffff;
		border-color: #58557b;
	}

	.btn.ghost {
		background: transparent;
		color: #c6c9df;
	}

	.btn.ghost:hover:not(.disabled) {
		color: #ffffff;
	}

	.btn.sm {
		min-height: 32px;
		padding: 6px 14px;
		font-size: 14px;
	}

	.btn.md {
		min-height: 40px;
		padding: 10px 18px;
		font-size: 16px;
	}

	.btn.lg {
		min-height: 48px;
		padding: 12px 24px;
		font-size: 18px;
	}

	.btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
