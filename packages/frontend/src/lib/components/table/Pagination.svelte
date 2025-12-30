<script lang="ts">
import { animate } from 'motion';

/**
 * ページネーションコンポーネント
 * @description ページ切り替えUI
 */

interface Props {
	/** 現在のページ（0始まり） */
	currentPage: number;
	/** 最大ページ数 */
	maxPage: number;
	/** ページ変更ハンドラ */
	onPageChange: (page: number) => void;
}

const { currentPage, maxPage, onPageChange }: Props = $props();

/** 表示するページ番号配列 */
const visiblePages = $derived(() => {
	const pages: number[] = [];
	const start = Math.max(0, currentPage - 3);
	const end = Math.min(maxPage, currentPage + 3);

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}
	return pages;
});

/**
 * ページボタンクリックハンドラ
 * @param page - ページ番号
 * @param button - ボタン要素
 */
function handlePageClick(page: number, button: HTMLButtonElement): void {
	if (page !== currentPage) {
		animate(button, { scale: [1, 0.9, 1] }, { duration: 0.2 });
		onPageChange(page);
	}
}

/**
 * ホバー開始ハンドラ
 * @param button - ボタン要素
 * @param isActive - アクティブ状態
 */
function handleMouseEnter(button: HTMLButtonElement, isActive: boolean): void {
	if (!isActive) {
		animate(button, { scale: 1.1 }, { duration: 0.15 });
	}
}

/**
 * ホバー終了ハンドラ
 * @param button - ボタン要素
 */
function handleMouseLeave(button: HTMLButtonElement): void {
	animate(button, { scale: 1 }, { duration: 0.15 });
}
</script>

<div class="pagination">
	{#each visiblePages() as page (page)}
		{@const isActive = page === currentPage}
		<button
			type="button"
			class="pagination__button"
			class:pagination__button--active={isActive}
			onclick={(e) => handlePageClick(page, e.currentTarget)}
			onmouseenter={(e) => handleMouseEnter(e.currentTarget, isActive)}
			onmouseleave={(e) => handleMouseLeave(e.currentTarget)}
		>
			{#if isActive}
				<span class="pagination__number font-alphanumeric">{page + 1}</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
	}

	.pagination__button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		border: 2px solid var(--color-border-secondary);
		background-color: transparent;
		cursor: pointer;
		transition:
			border-color var(--transition-fast),
			background-color var(--transition-fast);
	}

	.pagination__button:hover:not(.pagination__button--active) {
		border-color: var(--color-border-focus);
	}

	.pagination__button--active {
		background-color: var(--color-accent-primary);
		border-color: var(--color-accent-primary);
	}

	.pagination__number {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		color: var(--color-bg-primary);
	}
</style>
