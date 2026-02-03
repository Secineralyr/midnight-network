<script lang="ts">
import type { ApiSimpleUserInfoT } from '@midnight-network/shared/rpc/models';
import { IconSearch } from '@tabler/icons-svelte';
import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { blur, fade } from 'svelte/transition';
import { afterNavigate, goto } from '$app/navigation';
import { primeMisskeyUsers } from '$lib/data/misskey-users';
import { orpc } from '$lib/orpc';
import { sessionReady, sessionUser } from '$lib/stores/session';
import RankBadge from '../rank/RankBadge.svelte';
import UserSearch from '../search/UserSearch.svelte';
import LoggedInPanel from '../user/LoggedInPanel.svelte';
import UserAvatar from '../user/UserAvatar.svelte';

/**
 * ヘッダーコンポーネント
 * @description サイトヘッダー。ぼかし半透明、横グラデーションで透明になる
 */

interface Props {
	/** 現在のユーザー情報 */
	/** 検索ボタン表示フラグ（リーダーボードページ用） */
	showSearchButton?: boolean;
	/** 検索クリックハンドラ */
	onSearchClick?: () => void;
}

const { showSearchButton = false, onSearchClick }: Props = $props();

const queryClient = useQueryClient();

const currentUser = $derived($sessionUser);
const isSessionReady = $derived($sessionReady);

/** ログインデータ取得 */
const userInfoQuery = createQuery(() => ({
	queryKey: ['userInfo', currentUser?.id],
	queryFn: () => orpc.me.userInfo(),
	enabled: Boolean(currentUser),
}));

$effect(() => {
	const userId = userInfoQuery.data?.id;
	if (!userId) {
		return;
	}
	primeMisskeyUsers(queryClient, [userId]).catch(() => null);
});

let isPanelOpen = $state(false);
let isSearchOpen = $state(false);
let userMenuContainer: HTMLDivElement;

afterNavigate(() => {
	if (isSearchOpen) {
		isSearchOpen = false;
	}
});

/**
 * ユーザーアイコンクリック時のハンドラ
 */
function handleUserClick(): void {
	isPanelOpen = !isPanelOpen;
}

/**
 * パネルを閉じる
 */
function closePanel(): void {
	isPanelOpen = false;
}

function handleSearchClick(): void {
	isPanelOpen = false;
	isSearchOpen = true;
	onSearchClick?.();
}

function closeSearch(): void {
	isSearchOpen = false;
}

function handleSearchSelect(user: ApiSimpleUserInfoT): void {
	closeSearch();
	goto(`/user/${user.username}`);
}

function handleSearchKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape' && isSearchOpen) {
		closeSearch();
	}
}

/**
 * ウィンドウクリック時のハンドラ（パネル外クリックで閉じる）
 */
function handleWindowClick(event: MouseEvent): void {
	if (isPanelOpen && userMenuContainer && !userMenuContainer.contains(event.target as Node)) {
		isPanelOpen = false;
	}
}
</script>

<svelte:window onkeydown={handleSearchKeydown} onclick={handleWindowClick} />

<header>
	<div>
		<div class="left-side">
			<a href="/">
				<img src="/logo.png" alt="MidNight Network"/>
			</a>
			<div class="line"></div>
			<nav>
				<a href="/leaderboard">リーダーボード</a>
				<!-- 以下は現状無視 -->
				<!-- <a href="/about">MidNightについて</a> -->
				<!-- <a href="/ranks">ランク</a> -->
			</nav>
		</div>
		<div class="right-side">
			{#if showSearchButton}
				<button
					class="search-button"
					type="button"
					aria-haspopup="dialog"
					aria-expanded={isSearchOpen}
					aria-label="Open user search"
					onclick={handleSearchClick}
					in:fade={{ duration: 200 }}
					out:fade={{ duration: 200 }}
				>
					<IconSearch size={20} />
				</button>
			{/if}
			{#if currentUser}
				{#if userInfoQuery.data}
				<div class="logged-user" bind:this={userMenuContainer}>
					<button class="user-icon-button" type="button" onclick={handleUserClick}>
						<div class="icon">
							<UserAvatar userId={userInfoQuery.data.id} alt={userInfoQuery.data.username} />
						</div>
						<RankBadge rank={userInfoQuery.data.latestRank} class="user-rank-badge" />
					</button>
					{#if isPanelOpen}
						<div class="panel-overlay-position">
							<div class="panel-overlay">
								<LoggedInPanel user={userInfoQuery.data} onClose={closePanel} />
							</div>
						</div>
					{/if}
				</div>
				{/if}
			{:else if isSessionReady}
				<a href="/login">ログイン</a>
			{/if}
		</div>
	</div>
</header>

{#if isSearchOpen}
	<div class="search-modal-backdrop" in:fade={{ duration: 150 }} out:fade={{ duration: 150 }}>
		<button
			class="search-modal-dismiss"
			type="button"
			aria-label="Close search"
			onclick={closeSearch}
		></button>
		<div
			class="search-modal"
			role="dialog"
			aria-modal="true"
			aria-label="User search"
			tabindex="-1"
			in:blur={{ duration: 150, amount: 10 }}
			out:blur={{ duration: 150, amount: 10 }}
		>
			<UserSearch onSelect={handleSearchSelect} />
		</div>
	</div>
{/if}

<style>
	a {
		font-size: 1rem;
	}

	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		margin: 0 auto;
		padding: env(safe-area-inset-top) 150px 0;
		width: 1140px;
		height: 56px;
		background: linear-gradient(
			to right,
			transparent 0%,
			rgba(17, 12, 26, 0.75) 10%,
			rgba(17, 12, 26, 0.75) 90%,
			transparent 100%
		);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		z-index: 1;
	}

	header > div {
		display: flex;
		justify-content: space-between;
		padding: 10px 20px;
		height: 100%;
	}

	header > div > div {
		display: flex;
		height: 100%;
		gap: 20px;
		vertical-align: middle;
		align-items: center;
	}

	header > div > .left-side > .line {
		width: 1px;
		height: 100%;
		background-color: #4E4B71;
	}

	header > div > .left-side > a {
		height: 100%;
	}
	header > div > .left-side > a > img {
		height: 100%;
	}

	header > div > .right-side > .logged-user > .user-icon-button {
		height: 60px;
		width: 60px;
		position: relative;
		top: 16px;
		border-radius: 9999px;
		border: 2px solid #fff;
	}
	header > div > .right-side > .logged-user > .user-icon-button > .icon {
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		overflow: hidden;
	}

	header > div > .right-side > .logged-user > .user-icon-button > :global(.user-rank-badge) {
		position: absolute;
		bottom: -5px;
		right: -5px;
		width: 24px;
		height: 24px;
	}

	header > div > .right-side > .logged-user > .panel-overlay-position {
		position: relative;
	}
	header > div > .right-side > .logged-user > .panel-overlay-position > .panel-overlay {
		position: absolute;
		top: 20px;
		right: 0;
	}

	header > div > .right-side > .search-button {
		height: 42px;
		width: 42px;
		border-radius: 9999px;
		border: none;
		background: #4E4B71;
		color: #fff;
		cursor: pointer;
		display: grid;
		place-items: center;
		position: relative;
		top: 16px;
		transition: background-color 150ms ease, color 150ms ease;
	}

	header > div > .right-side > .search-button:hover {
		background: #B8C4FF;
		color: #000;
	}

	/* デスクトップ表示 (900px - 1149px) */
	@media (max-width: 1149px) {
		header {
			width: 100%;
			background: rgba(17, 12, 26, 0.75);
		}
	}

	/* モバイル表示 (300px - 899px) */
	@media (max-width: 899px) {
		header {
			padding: 0 10px;
		}
		header > div {
			padding: 10px;
		}
		header > div > .left-side {
			gap: 20px;
		}
		nav a {
			font-size: 0.85rem;
		}
		header > div > .right-side > .logged-user > .user-icon-button {
			height: 45px;
			width: 45px;
			top: 0;
		}
		header > div > .right-side > .search-button {
			height: 36px;
			width: 36px;
			top: 0;
		}
	}

	.search-modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(3, 0, 10, 0.4);
		backdrop-filter: blur(5px);
		z-index: 20;
	}

	.search-modal-dismiss {
		position: absolute;
		inset: 0;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
	}

	.search-modal {
		position: absolute;
		z-index: 1;
		width: 100%;
		display: flex;
		justify-content: center;
		top: 200px;
	}
</style>
