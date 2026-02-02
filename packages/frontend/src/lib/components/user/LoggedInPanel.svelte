<script lang="ts">
import type { SettingTypeT, UserInfoResponseT } from '@midnight-network/shared/rpc/me/models';
import { IconLogout, IconSettings, IconUser } from '@tabler/icons-svelte';
import { fly } from 'svelte/transition';
import { goto } from '$app/navigation';
import RankIcon from '../rank/RankIcon.svelte';
import { orpc } from '$lib/orpc';
import { sessionUser } from '$lib/stores/session';
import { createQuery, createMutation } from '@tanstack/svelte-query';
import SettingsModal from '../modal/SettingsModal.svelte';
	import { setUserSettingsOpened } from '$lib/stores/state';

interface Props {
	/** ユーザー情報 */
	user: UserInfoResponseT;
	/** パネルを閉じるハンドラ */
	onClose: () => void;
}

const { user, onClose }: Props = $props();

/**
 * マイページへ遷移
 */
function goToMyPage(): void {
	onClose();
	goto(`/user/${user.username}`);
}

/**
 * ログアウト処理
 */
function handleLogout(): void {
	onClose();
	goto('/logout');
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

/**
 * 設定モーダルを開く
 */
function openSettings(): void {
	setUserSettingsOpened(true);
}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="panel" transition:fly={{ y: -10, duration: 200 }}>
	<div class="panel-header">
		<div class="panel-info">
			<span class="panel-status">ログイン中</span>
			<span class="panel-name">@{user.username}</span>
		</div>
		<div class="panel-rank">
			<RankIcon rank={user.latestRank} />
		</div>
	</div>
	<div class="panel-divider"></div>
	<div class="panel-actions">
		<button type="button" class="panel-action" onclick={goToMyPage}>
			<span class="panel-text">マイページ</span>
			<IconUser size={16} stroke={3} />
		</button>
		<button type="button" class="panel-action" onclick={openSettings}>
			<span class="panel-text">設定</span>
			<IconSettings size={16} stroke={3} />
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
