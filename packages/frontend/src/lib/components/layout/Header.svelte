<script lang="ts">
import { IconSearch } from '@tabler/icons-svelte';
import LoggedInPanel from '../user/LoggedInPanel.svelte';

/**
 * ヘッダーコンポーネント
 * @description サイトヘッダー。ぼかし半透明、横グラデーションで透明になる
 */

interface Props {
	/** 現在のユーザー情報 */
	user?: {
		/** ユーザーID */
		userId: string;
		/** ユーザー名 */
		username: string;
		/** アバターURL */
		avatarUrl?: string;
	} | null;
	/** 検索ボタン表示フラグ（リーダーボードページ用） */
	showSearchButton?: boolean;
	/** 検索クリックハンドラ */
	onSearchClick?: () => void;
}

const { user = null, showSearchButton = false, onSearchClick }: Props = $props();

let isPanelOpen = $state(false);

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
</script>

<header class="header">
	<div class="header__inner">
		<div class="header__left">
			<a href="/" class="header__logo">
				<img src="/images/logo.svg" alt="MidNight Network" class="header__logo-image" />
			</a>
			<nav class="header__nav">
				<a href="/leaderboard" class="header__nav-link">リーダーボード</a>
				<!-- 以下は現状無視 -->
				<!-- <a href="/about" class="header__nav-link">MidNightについて</a> -->
				<!-- <a href="/ranks" class="header__nav-link">ランク</a> -->
			</nav>
		</div>
		<div class="header__right">
			{#if showSearchButton}
				<button type="button" class="header__search-button" onclick={onSearchClick}>
					<IconSearch size={20} />
				</button>
			{/if}
			{#if user}
				<button type="button" class="header__user" onclick={handleUserClick}>
					<img
						src={user.avatarUrl || '/images/default-avatar.png'}
						alt={user.username}
						class="header__user-avatar"
					/>
				</button>
				{#if isPanelOpen}
					<LoggedInPanel {user} onClose={closePanel} />
				{/if}
			{:else}
				<a href="/login" class="header__login-link">ログイン</a>
			{/if}
		</div>
	</div>
</header>

<style>
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--header-height);
		background: linear-gradient(
			to right,
			var(--color-bg-header) 0%,
			var(--color-bg-header) 70%,
			transparent 100%
		);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		z-index: var(--z-sticky);
		border-bottom: 1px solid var(--color-border-secondary);
	}

	.header__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: 0 var(--spacing-lg);
	}

	.header__left {
		display: flex;
		align-items: center;
		gap: var(--spacing-xl);
	}

	.header__logo {
		display: flex;
		align-items: center;
	}

	.header__logo-image {
		height: 32px;
		width: auto;
	}

	.header__nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.header__nav-link {
		font-family: var(--font-japanese);
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		transition: color var(--transition-fast);
	}

	.header__nav-link:hover {
		color: var(--color-text-primary);
	}

	.header__right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		position: relative;
	}

	.header__search-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		background-color: var(--color-bg-card);
		color: var(--color-text-secondary);
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.header__search-button:hover {
		background-color: var(--color-bg-card-hover);
		color: var(--color-text-primary);
	}

	.header__user {
		display: flex;
		align-items: center;
		border-radius: var(--radius-full);
		overflow: hidden;
		cursor: pointer;
	}

	.header__user-avatar {
		width: 40px;
		height: 40px;
		object-fit: cover;
		border-radius: var(--radius-full);
		border: 2px solid var(--color-border-secondary);
		transition: border-color var(--transition-fast);
	}

	.header__user:hover .header__user-avatar {
		border-color: var(--color-border-focus);
	}

	.header__login-link {
		font-family: var(--font-japanese);
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-lg);
		transition:
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.header__login-link:hover {
		border-color: var(--color-border-focus);
		color: var(--color-text-primary);
	}

	@media (max-width: 768px) {
		.header__nav {
			display: none;
		}
	}
</style>
