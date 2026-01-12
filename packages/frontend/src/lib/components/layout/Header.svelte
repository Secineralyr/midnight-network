<script lang="ts">
import { IconSearch } from '@tabler/icons-svelte';
import LoggedInPanel from '../user/LoggedInPanel.svelte';
import RankBadge from '../rank/RankBadge.svelte';

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
		/** ランク値 */
		rank?: number;
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
				<button type="button" onclick={onSearchClick}>
					<IconSearch size={20} />
				</button>
			{/if}
			{#if user}
				<div class="logged-user">
					<button class="user-icon-button" type="button" onclick={handleUserClick}>
						<img
							class="icon"
							src={user.avatarUrl || 'https://placehold.co/400'}
							alt={user.username}
						/>
						{#if user.rank !== undefined}
							<RankBadge rank={user.rank} class="user-rank-badge" />
						{/if}
					</button>
					{#if isPanelOpen}
						<div class="panel-overlay-position">
							<div class="panel-overlay">
								<LoggedInPanel {user} onClose={closePanel} />
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/login">ログイン</a>
			{/if}
		</div>
	</div>
</header>

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
		padding: 0 150px;
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
		height: 100%;
		border-radius: 9999px;
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
</style>
