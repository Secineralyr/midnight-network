<script lang="ts">
import type { SettingTypeT } from '@midnight-network/shared/rpc/me/models';
import { IconX } from '@tabler/icons-svelte';
import { fade, scale } from 'svelte/transition';
import Button from '../ui/Button.svelte';

/**
 * ユーザー設定モーダルコンポーネント
 * @description ユーザーのプライバシー設定を変更するモーダル
 */

interface Props {
	/** 現在の設定 */
	settings: SettingTypeT;
	/** 表示状態 */
	isOpen: boolean;
	/** 閉じるハンドラ */
	onClose: () => void;
	/** 保存ハンドラ */
	onSave: (settings: Partial<SettingTypeT>) => void;
}

const { settings, isOpen, onClose, onSave }: Props = $props();

let localSettings = $state<SettingTypeT>({ ...settings });

$effect(() => {
	localSettings = { ...settings };
});

/**
 * 設定トグルの変更ハンドラ
 * @param key - 設定キー
 * @param value - 新しい値
 */
function handleToggle(key: keyof SettingTypeT, value: boolean): void {
	localSettings = { ...localSettings, [key]: value };
}

/**
 * 保存ボタンクリックハンドラ
 */
function handleSave(): void {
	onSave(localSettings);
	onClose();
}

/**
 * バックドロップクリックハンドラ
 * @param event - クリックイベント
 */
function handleBackdropClick(event: MouseEvent): void {
	if (event.target === event.currentTarget) {
		onClose();
	}
}

/** 設定項目の定義 */
const settingItems: { key: keyof SettingTypeT; label: string }[] = [
	{ key: 'showLeaderboardRank', label: 'ランクをリーダーボードに表示する' },
	{ key: 'showLeaderboardRanking', label: 'ランキングをリーダーボードに表示する' },
	{ key: 'showProfileStats', label: '他ユーザーにマイページを公開する' },
	{ key: 'showProfileSearch', label: '検索に引き当たるようにする' },
];
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 150 }}
	>
		<div class="modal" transition:scale={{ duration: 150, start: 0.95 }}>
			<div class="modal-header">
				<h2 class="modal-title">ユーザー設定</h2>
				<button type="button" class="modal-close" onclick={onClose}>
					<IconX size={24} />
				</button>
			</div>
			<div class="modal-body">
				{#each settingItems as item (item.key)}
					<div class="modal-item">
						<span class="modal-label">{item.label}</span>
						<button
							type="button"
							class="toggle"
							class:active={localSettings[item.key]}
							onclick={() => handleToggle(item.key, !localSettings[item.key])}
							role="switch"
							aria-checked={localSettings[item.key]}
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
				{/each}
			</div>
			<div class="modal-footer">
				<Button onclick={handleSave}>保存</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 300;
		padding: 24px;
	}

	.modal {
		width: 100%;
		max-width: 720px;
		background: #23213a;
		border-radius: 18px;
		box-shadow: 0 20px 40px rgba(7, 6, 16, 0.45);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22px 26px 12px;
	}

	.modal-title {
		font-size: 26px;
		font-weight: 600;
		color: #ffffff;
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.modal-close:hover {
		opacity: 1;
	}

	.modal-body {
		padding: 8px 26px 8px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.modal-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.modal-label {
		font-size: 18px;
		color: #ffffff;
	}

	.toggle {
		position: relative;
		width: 58px;
		height: 30px;
		background: #3a3755;
		border-radius: 999px;
		padding: 2px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.toggle-knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 24px;
		height: 24px;
		background: #b9c4ff;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.toggle.active {
		background: #5560a6;
	}

	.toggle.active .toggle-knob {
		transform: translateX(28px);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		padding: 16px 26px 24px;
	}
</style>
