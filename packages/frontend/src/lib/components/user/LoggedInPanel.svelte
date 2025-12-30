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
<div class="panel-backdrop" onclick={handleBackdropClick}>
	<div class="panel" bind:this={panelElement}>
		<div class="panel__header">
			<div class="panel__user-info">
				<span class="panel__status">ログイン中</span>
				<span class="panel__username">@{user.username}</span>
			</div>
			<div class="panel__rank">
				<RankIcon rank={currentRank} size="lg" />
			</div>
		</div>
		<div class="panel__actions">
			<button type="button" class="panel__action" onclick={goToMyPage}>
				<span class="panel__action-text">マイページ</span>
				<IconUser size={20} />
			</button>
			<button type="button" class="panel__action" onclick={handleLogout}>
				<span class="panel__action-text">ログアウト</span>
				<IconLogout size={20} />
			</button>
		</div>
	</div>
</div>

<style>
	.panel-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: var(--z-dropdown);
	}

	.panel {
		position: absolute;
		top: calc(var(--header-height) + var(--spacing-sm));
		right: var(--spacing-lg);
		width: 280px;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-lg);
	}

	.panel__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		background-color: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border-secondary);
	}

	.panel__user-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.panel__status {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.panel__username {
		font-family: var(--font-alphanumeric);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.panel__rank {
		display: flex;
		align-items: center;
	}

	.panel__actions {
		display: flex;
		flex-direction: column;
	}

	.panel__action {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg);
		color: var(--color-text-primary);
		font-family: var(--font-japanese);
		font-size: var(--font-size-base);
		border-bottom: 1px solid var(--color-border-secondary);
		transition: background-color var(--transition-fast);
	}

	.panel__action:last-child {
		border-bottom: none;
	}

	.panel__action:hover {
		background-color: var(--color-bg-card-hover);
	}

	.panel__action-text {
		flex: 1;
		text-align: center;
	}
</style>
