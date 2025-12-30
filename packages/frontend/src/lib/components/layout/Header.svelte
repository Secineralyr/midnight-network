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
				<button type="button" onclick={handleUserClick}>
					<img
						src={user.avatarUrl || '/images/default-avatar.png'}
						alt={user.username}
					/>
				</button>
				{#if isPanelOpen}
					<LoggedInPanel {user} onClose={closePanel} />
				{/if}
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
			#110C1A 10%,
			#110C1A 90%,
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

	header > div > .left-side {

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

	header > div > .right-side {

	}
</style>
