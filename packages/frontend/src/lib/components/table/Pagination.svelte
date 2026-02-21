<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { animate } from 'motion';

/**
 * ページネーションコンポーネント
 * @description ページ切り替えUI
 */

interface Props {
	/** 現在のページ（1始まり） */
	currentPage: number;
	/** 最大ページ数（1始まり） */
	maxPage: number;
	/** ページ変更ハンドラ */
	onPageChange: (page: number) => void;
}

const { currentPage, maxPage, onPageChange }: Props = $props();

/** 表示するページ番号配列（最大5ページ） */
const visiblePages = $derived(() => {
	const pages: number[] = [];

	if (maxPage <= 5) {
		for (let i = 1; i <= maxPage; i++) {
			pages.push(i);
		}
	} else {
		let start = Math.max(1, currentPage - 2);
		let end = start + 4;

		if (end > maxPage) {
			end = maxPage;
			start = end - 4;
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
	}
	return pages;
});

/** 前へボタンが非活性かどうか */
const isPrevDisabled = $derived(currentPage === 1 || maxPage < 5);

/** 次へボタンが非活性かどうか */
const isNextDisabled = $derived(currentPage === maxPage || maxPage < 5);

/**
 * ページボタンクリックハンドラ
 */
function handlePageClick(page: number, button: HTMLButtonElement): void {
	if (page !== currentPage) {
		animate(button, { scale: [1, 0.9, 1] }, { duration: 0.2 });
		onPageChange(page);
	}
}

/**
 * 前へボタンクリックハンドラ
 */
function handlePrev(button: HTMLButtonElement): void {
	if (!isPrevDisabled) {
		animate(button, { scale: [1, 0.9, 1] }, { duration: 0.2 });
		onPageChange(currentPage - 1);
	}
}

/**
 * 次へボタンクリックハンドラ
 */
function handleNext(button: HTMLButtonElement): void {
	if (!isNextDisabled) {
		animate(button, { scale: [1, 0.9, 1] }, { duration: 0.2 });
		onPageChange(currentPage + 1);
	}
}
</script>

<div class="pager">
	<button
		type="button"
		class="pager-arrow"
		class:disabled={isPrevDisabled}
		onclick={(e) => handlePrev(e.currentTarget)}
		aria-label="前のページ"
	>
		<svg width="8" height="12" viewBox="0 0 8 12" fill="none">
			<path d="M7 1L2 6L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		</svg>
	</button>

	{#each visiblePages() as page (page)}
		{@const isActive = page === currentPage}
		<button
			type="button"
			class="pager-button"
			class:active={isActive}
			onclick={(e) => handlePageClick(page, e.currentTarget)}
		>
			<span class="pager-number">{page}</span>
		</button>
	{/each}

	<button
		type="button"
		class="pager-arrow"
		class:disabled={isNextDisabled}
		onclick={(e) => handleNext(e.currentTarget)}
		aria-label="次のページ"
	>
		<svg width="8" height="12" viewBox="0 0 8 12" fill="none">
			<path d="M1 1L6 6L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
		</svg>
	</button>
</div>

<style>
	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
	}

	.pager-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid #4E4B71;
		background: transparent;
		color: #fff;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
	}

	.pager-button:hover {
		background: #b8c4ff;
		border-color: #b8c4ff;
		color: #201e3a;
	}

	.pager-button.active {
		background: #b8c4ff;
		border-color: #b8c4ff;
		color: #201e3a;
	}

	.pager-number {
		font-size: 1rem;
		font-weight: 500;
	}

	.pager-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid #b8c4ff;
		background: transparent;
		color: #fff;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.pager-arrow:hover:not(.disabled) {
		background: #b8c4ff;
		color: #201e3a;
	}

	.pager-arrow.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
