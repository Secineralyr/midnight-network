<script lang="ts">
import type { ApiSimpleUserInfoT } from '@midnight-network/shared/rpc/models';
import { IconSearch } from '@tabler/icons-svelte';
import { createQuery } from '@tanstack/svelte-query';
import { animate } from 'motion';
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
let inputElement: HTMLInputElement | undefined = $state();
let suggestionsElement: HTMLDivElement | undefined = $state();

/** 検索クエリ（デバウンス用） */
let debouncedQuery = $state('');
let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

$effect(() => {
	if (debounceTimeout) {
		clearTimeout(debounceTimeout);
	}
	debounceTimeout = setTimeout(() => {
		debouncedQuery = searchQuery;
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
	enabled: debouncedQuery.length >= 2,
}));

/** サジェストを表示するかどうか */
const showSuggestions = $derived(isFocused && debouncedQuery.length >= 2 && (searchResults.data?.length ?? 0) > 0);

$effect(() => {
	if (suggestionsElement && showSuggestions) {
		animate(suggestionsElement, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.2 });
	}
});

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
	<div class="search__input-wrapper">
		<IconSearch size={20} class="search__icon" />
		<input
			bind:this={inputElement}
			type="text"
			class="search__input"
			{placeholder}
			value={searchQuery}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
		/>
	</div>
	{#if showSuggestions}
		<div class="search__suggestions" bind:this={suggestionsElement}>
			{#each searchResults.data ?? [] as user (user.userId)}
				<button
					type="button"
					class="search__suggestion"
					onclick={() => handleSelectUser(user)}
				>
					<span class="search__suggestion-username">@{user.username}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.search {
		position: relative;
		width: 100%;
		max-width: 500px;
	}

	.search__input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg);
		background-color: var(--color-bg-input);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-full);
		transition: border-color var(--transition-fast);
	}

	.search__input-wrapper:focus-within {
		border-color: var(--color-border-focus);
	}

	.search :global(.search__icon) {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.search__input {
		flex: 1;
		font-family: var(--font-japanese);
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		background: transparent;
	}

	.search__input::placeholder {
		color: var(--color-text-placeholder);
	}

	.search__suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: var(--spacing-sm);
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		z-index: var(--z-dropdown);
		box-shadow: var(--shadow-lg);
	}

	.search__suggestion {
		display: block;
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-lg);
		text-align: left;
		font-family: var(--font-alphanumeric);
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.search__suggestion:hover {
		background-color: var(--color-bg-card-hover);
	}

	.search__suggestion-username {
		color: var(--color-text-primary);
	}
</style>
