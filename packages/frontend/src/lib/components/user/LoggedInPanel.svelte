<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import { IconLogout, IconUser } from '@tabler/icons-svelte';
import { animate } from 'motion';
import type { RankTypeValue } from '$lib/utils/rank';
import RankIcon from '../rank/RankIcon.svelte';

/**
 * ログインユーザーパネルコンポーネント
 * @description ヘッダーのユーザーアイコンクリック時に表示されるパネル
 */

interface Props {
	/** ユーザー情報 */
	user: {
		/** ユーザーID */
		userId: string;
		/** ユーザー名 */
		username: string;
		/** アバターURL */
		avatarUrl?: string;
	};
	/** 現在のランク */
	currentRank?: RankTypeValue;
	/** パネルを閉じるハンドラ */
	onClose: () => void;
}

const { user, currentRank = RankType.GoldBefore, onClose }: Props = $props();

let panelElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (panelElement) {
		animate(panelElement, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.2 });
	}
});

/**
 * マイページへ遷移
 */
function goToMyPage(): void {
	onClose();
	window.location.href = `/user/${user.username}`;
}

/**
 * ログアウト処理
 */
function handleLogout(): void {
	onClose();
	window.location.href = '/logout';
}

/**
 * 外側クリック時のハンドラ
 * @param event - クリックイベント
 */
function handleBackdropClick(event: MouseEvent): void {
	if (event.target === event.currentTarget) {
		onClose();
	}
}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="panel" bind:this={panelElement}>
	<div class="panel-header">
		<div class="panel-info">
			<span class="panel-status">ログイン中</span>
			<span class="panel-name">@{user.username}</span>
		</div>
		<div class="panel-rank">
			<RankIcon rank={currentRank} />
		</div>
	</div>
	<div class="panel-divider"></div>
	<div class="panel-actions">
		<button type="button" class="panel-action" onclick={goToMyPage}>
			<span class="panel-text">マイページ</span>
			<IconUser size={16} stroke={3} />
		</button>
		<button type="button" class="panel-action" onclick={handleLogout}>
			<span class="panel-text">ログアウト</span>
			<IconLogout size={16} stroke={3} />
		</button>
	</div>
</div>

<style>
	.panel {
		background: #201E3A;
		border-radius: 8px;
		box-shadow: 0 0 5px rgba(0, 0, 0, .25);
		overflow: hidden;
		padding: 10px 20px;
		color: #ffffff;
		font-size: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
	}

	.panel-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.panel-info > span {
		white-space: nowrap;
	}

	.panel-rank {
		width: 60px;
	}

	.panel-rank :global(.rank-icon) {
		width: 100%;
		height: 100%;
	}


	.panel-status {
		font-size: 0.9em;
	}

	.panel-name {
		font-weight: 600;
	}

	.panel-divider {
		height: 1px;
		background: #2F2D53;
	}

	.panel-actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 5px;
	}

	.panel-action {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 5px;
		font-weight: 600;
		transition: opacity 0.15s ease;
	}

	.panel-action:hover {
		opacity: 0.85;
	}
</style>
