<script lang="ts">
import type { SettingTypeT } from '@midnight-network/shared/rpc/me/models';
import { IconX } from '@tabler/icons-svelte';
import { animate } from 'motion';
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
let modalElement: HTMLDivElement | undefined = $state();
let backdropElement: HTMLDivElement | undefined = $state();

$effect(() => {
	localSettings = { ...settings };
});

$effect(() => {
	if (modalElement && backdropElement && isOpen) {
		animate(backdropElement, { opacity: [0, 1] }, { duration: 0.2 });
		animate(modalElement, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.2 });
	}
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
	handleClose();
}

/**
 * 閉じるハンドラ（アニメーション付き）
 */
async function handleClose(): Promise<void> {
	if (modalElement && backdropElement) {
		await Promise.all([
			animate(backdropElement, { opacity: [1, 0] }, { duration: 0.15 }).finished,
			animate(modalElement, { opacity: [1, 0], scale: [1, 0.95] }, { duration: 0.15 }).finished,
		]);
	}
	onClose();
}

/**
 * バックドロップクリックハンドラ
 * @param event - クリックイベント
 */
function handleBackdropClick(event: MouseEvent): void {
	if (event.target === event.currentTarget) {
		handleClose();
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
	<div class="settings-modal__backdrop" bind:this={backdropElement} onclick={handleBackdropClick}>
		<div class="settings-modal" bind:this={modalElement}>
			<div class="settings-modal__header">
				<h2 class="settings-modal__title">ユーザー設定</h2>
				<button type="button" class="settings-modal__close" onclick={handleClose}>
					<IconX size={24} />
				</button>
			</div>
			<div class="settings-modal__content">
				{#each settingItems as item (item.key)}
					<div class="settings-modal__item">
						<span class="settings-modal__label">{item.label}</span>
						<button
							type="button"
							class="settings-modal__toggle"
							class:settings-modal__toggle--active={localSettings[item.key]}
							onclick={() => handleToggle(item.key, !localSettings[item.key])}
							role="switch"
							aria-checked={localSettings[item.key]}
						>
							<span class="settings-modal__toggle-knob"></span>
						</button>
					</div>
				{/each}
			</div>
			<div class="settings-modal__footer">
				<Button onclick={handleSave}>保存</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-modal__backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-bg-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-modal-backdrop);
	}

	.settings-modal {
		width: 100%;
		max-width: 480px;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-xl);
		overflow: hidden;
		z-index: var(--z-modal);
	}

	.settings-modal__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border-secondary);
	}

	.settings-modal__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.settings-modal__close {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		transition: color var(--transition-fast);
	}

	.settings-modal__close:hover {
		color: var(--color-text-primary);
	}

	.settings-modal__content {
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.settings-modal__item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
	}

	.settings-modal__label {
		font-family: var(--font-japanese);
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
	}

	.settings-modal__toggle {
		position: relative;
		width: 52px;
		height: 28px;
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-full);
		padding: 2px;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.settings-modal__toggle--active {
		background-color: var(--color-accent-primary);
	}

	.settings-modal__toggle-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 24px;
		height: 24px;
		background-color: var(--color-bg-primary);
		border-radius: var(--radius-full);
		transition: transform var(--transition-fast);
	}

	.settings-modal__toggle--active .settings-modal__toggle-knob {
		transform: translateX(24px);
	}

	.settings-modal__footer {
		display: flex;
		justify-content: center;
		padding: var(--spacing-lg);
		border-top: 1px solid var(--color-border-secondary);
	}
</style>
