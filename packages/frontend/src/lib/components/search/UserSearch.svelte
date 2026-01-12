<script lang="ts">
import type { ApiSimpleUserInfoT } from '@midnight-network/shared/rpc/models';
import { IconSearch } from '@tabler/icons-svelte';
import { createQuery } from '@tanstack/svelte-query';
import { fly } from 'svelte/transition';
import { orpc } from '$lib/orpc';

/**
 * ユーザー検索コンポーネント
 * @description ユーザー名検索とサジェスト表示
 */

interface Props {
	/** プレースホルダー */
	placeholder?: string;
	/** ユーザー選択ハンドラ */
	onSelect?: (user: ApiSimpleUserInfoT) => void;
}

const { placeholder = 'ユーザー名を入力', onSelect }: Props = $props();

let searchQuery = $state('');
let isFocused = $state(false);

/** 検索クエリ（デバウンス用） */
let debouncedQuery = $state('');
let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

$effect(() => {
	// searchQueryを同期的に読み取ることで依存関係として追跡される
	const currentQuery = searchQuery;

	if (debounceTimeout) {
		clearTimeout(debounceTimeout);
	}
	debounceTimeout = setTimeout(() => {
		debouncedQuery = currentQuery;
	}, 300);

	return () => {
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
	};
});

/** ユーザー検索クエリ */
const searchResults = createQuery(() => ({
	queryKey: ['searchUser', debouncedQuery],
	queryFn: () => orpc.searchUser(debouncedQuery),
	enabled: debouncedQuery.length > 0,
}));

/** 検索中かどうか */
const isSearching = $derived(debouncedQuery.length > 0 && searchResults.isLoading);

/** サジェストドロップダウンを表示するかどうか */
const showDropdown = $derived(isFocused && debouncedQuery.length > 0);

/** 検索結果があるかどうか */
const hasResults = $derived((searchResults.data?.length ?? 0) > 0);

/** 表示する検索結果 */
const displayResults = $derived(searchResults.data ?? []);

/**
 * 入力変更ハンドラ
 * @param event - 入力イベント
 */
function handleInput(event: Event): void {
	const target = event.target as HTMLInputElement;
	searchQuery = target.value;
}

/**
 * フォーカスハンドラ
 */
function handleFocus(): void {
	isFocused = true;
}

/**
 * ブラーハンドラ
 */
function handleBlur(): void {
	setTimeout(() => {
		isFocused = false;
	}, 200);
}

/**
 * ユーザー選択ハンドラ
 * @param user - 選択されたユーザー
 */
function handleSelectUser(user: ApiSimpleUserInfoT): void {
	searchQuery = '';
	isFocused = false;
	onSelect?.(user);
}

/**
 * キーダウンハンドラ（Enter押下でユーザーページへ遷移）
 * @param event - キーダウンイベント
 */
function handleKeydown(event: KeyboardEvent): void {
	if (event.key === 'Enter' && searchResults.data && searchResults.data.length > 0) {
		handleSelectUser(searchResults.data[0]);
	}
}
</script>

<div class="search">
	<div class="search-input-wrapper">
		<IconSearch size={20} class="search-icon" />
		<input
			type="text"
			class="search-input"
			{placeholder}
			value={searchQuery}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
		/>
	</div>
	{#if showDropdown}
		<div class="search-suggestions" transition:fly={{ y: -10, duration: 200 }}>
			{#if isSearching}
				<div class="search-loading">検索中...</div>
			{:else if hasResults}
				<div class="search-results-list">
					{#each displayResults as user (user.userId)}
						<button
							type="button"
							class="search-suggestion"
							onclick={() => handleSelectUser(user)}
						>
							<span class="search-suggestion-username">@{user.username}</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="search-no-results">ユーザーが見つかりません</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.search {
		position: relative;
		width: 100%;
		max-width: 500px;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 15px 20px;
		background-color: #2F2D53;
		border: 1px solid #2F2D53;
		border-radius: 9999px;
		transition: border-color 150ms ease;
	}

	.search-input-wrapper:focus-within {
		border-color: #4E4B71;
	}

	.search :global(.search-icon) {
		color: #fff;
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		font-family: 'M PLUS 2', sans-serif;
		font-size: 1rem;
		color: #ffffff;
		background: transparent;
	}

	.search-input::placeholder {
		color: #6b6f7e;
	}

	.search-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 10px;
		background-color: #201E3A;
		border: 1px solid #2F2D53;
		border-radius: 5px;
		overflow: hidden;
		z-index: 100;
		box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
	}

	.search-results-list {
		max-height: calc(40px * 6);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.search-loading,
	.search-no-results {
		padding: 10px 20px;
		text-align: center;
		font-family: 'M PLUS 2', sans-serif;
		font-size: 0.875rem;
		color: #ddd;
	}

	.search-suggestion {
		display: flex;
		align-items: center;
		width: 100%;
		height: 40px;
		padding: 0 20px;
		text-align: left;
		font-family: 'Lexend', sans-serif;
		font-size: 1rem;
		color: #ffffff;
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	.search-suggestion:hover {
		background-color: #2F2D53;
	}

	.search-suggestion-username {
		color: #ffffff;
	}
</style>
