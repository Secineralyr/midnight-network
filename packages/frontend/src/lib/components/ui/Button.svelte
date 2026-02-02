<script lang="ts">
/** ボタンのバリアント */
type ButtonVariant = 'primary' | 'secondary';

interface Props {
	/** ボタンのバリアント */
	variant?: ButtonVariant;
	/** 無効状態 */
	disabled?: boolean;
	/** ボタンタイプ */
	type?: 'button' | 'submit' | 'reset';
	/** クリックハンドラ */
	onclick?: (event: MouseEvent) => void;
	/** 子要素 */
	children?: import('svelte').Snippet;
}

const { variant = 'primary', disabled = false, type = 'button', onclick, children }: Props = $props();

let buttonElement: HTMLButtonElement | undefined = $state();

/**
 * クリック時のアニメーション
 */
function handleClick(event: MouseEvent): void {
	onclick?.(event);
}
</script>

<button
	bind:this={buttonElement}
	class={`btn ${variant}`}
	class:disabled={disabled}
	{type}
	{disabled}
	onclick={handleClick}
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
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
		white-space: nowrap;
		min-height: 32px;
		width: inherit;
		padding: 5px 15px;
		font-size: 1em;
	}

	.btn.primary {
		background: #B8C4FF;
		color: #000;
	}

	.btn.primary:hover:not(.disabled) {
		background: #6970cf;
		color: #fff;
	}

	.btn.secondary {
		background: #2F2D53;
		color: #fff;
	}

	.btn.secondary:hover:not(.disabled) {
		color: #fff;
		background: #383669;
	}

	.btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
