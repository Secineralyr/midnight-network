<script lang="ts">
import { orpc } from '$lib/orpc';
import { setUserSettingsOpened, userSettingsOpened } from '$lib/stores/state';
import type { SettingTypeT } from '@midnight-network/shared/rpc/me/models';
import { IconX } from '@tabler/icons-svelte';
import { createMutation, createQuery } from '@tanstack/svelte-query';
import { blur, fade } from 'svelte/transition';
import Button from '../ui/Button.svelte';

/** 設定モーダル表示状態 */
let isOpen = $derived($userSettingsOpened);

/** 設定取得 */
const settingsQuery = createQuery(() => ({
	queryKey: ['settings'],
	queryFn: () => orpc.me.getSettings(),
}));

/** 設定更新ミューテーション */
const settingsMutation = createMutation(() => ({
	mutationFn: (settings: Partial<SettingTypeT>) => orpc.me.setSettings(settings),
	onSuccess: () => {
		settingsQuery.refetch();
	},
}));

/**
 * 設定モーダルを閉じる
 */
function closeSettings(): void {
	setUserSettingsOpened(false);
}

/**
 * 設定保存ハンドラ
 * @param settings - 新しい設定
 */
function handleSaveSettings(settings: Partial<SettingTypeT>): void {
	settingsMutation.mutate(settings);
}

let localSettings = $derived.by<SettingTypeT>(() => ({ ...settingsQuery.data }));
let pushEnabled = $state(false);
let pushLoading = $state(false);
const pushSupported = $derived('serviceWorker' in navigator && 'PushManager' in window);

$effect(() => {
	if (pushSupported && isOpen) {
		loadPushStatus();
	}
});

async function loadPushStatus() {
	try {
		const status = await orpc.me.getPushStatus();
		pushEnabled = status.enabled;
	} catch {
		pushEnabled = false;
	}
}

let swRegistration: ServiceWorkerRegistration | null = null;
navigator.serviceWorker.ready.then(reg => {
  swRegistration = reg;
});
async function handlePushToggle() {
	if (pushLoading) {
		return;
	}
	pushLoading = true;

	try {
		if (pushEnabled) {
			// Disable push
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			if (subscription) {
				const endpoint = subscription.endpoint;
				await subscription.unsubscribe();
				await orpc.me.unsubscribePush({ endpoint });
			}

			pushEnabled = false;
		} else {
			// Enable push
			const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);

			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				pushLoading = false;
				return;
			}
			if (!swRegistration) {
				alert('SW not ready');
				return;
			}
			const subscription = await Promise.race([
				swRegistration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: vapidKey.slice(),
				}),
				new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000)),
			]);

			const json = subscription.toJSON();
			const keys = json.keys ?? {};
			await orpc.me.subscribePush({
				endpoint: json.endpoint ?? '',
				p256dh: keys.p256dh ?? '',
				auth: keys.auth ?? '',
			});

			pushEnabled = true;
		}
	} catch (e) {
		console.error('Push toggle failed:', e);
		alert(`'Push toggle failed:', ${e}`);
	} finally {
		pushLoading = false;
	}
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

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
	handleSaveSettings(localSettings);
	closeSettings();
}

async function handleNotification() {
	await orpc.me.testPush();
}

/** 設定項目の定義 */
const settingItems: { key: keyof SettingTypeT; label: string }[] = [
	{ key: 'showLeaderboardRank', label: 'ランクをリーダーボードに表示する' },
	{ key: 'showLeaderboardRanking', label: 'ランキングをリーダーボードに表示する' },
	{ key: 'showProfileStats', label: '他ユーザーにマイページを公開する' },
	{ key: 'showProfileSearch', label: '検索に引き当たるようにする' },
];
</script>

{#if isOpen && settingsQuery.data}
	<div class="modal-backdrop" in:fade={{ duration: 150 }} out:fade={{ duration: 150 }}>
		<button class="modal-dismiss" type="button" onclick={closeSettings} aria-label="閉じる"></button>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-modal-title"
			tabindex="-1"
			in:blur={{ duration: 150, amount: 10 }}
			out:blur={{ duration: 150, amount: 10 }}
		>
			<div class="modal-header">
				<h2 id="settings-modal-title">ユーザー設定</h2>
				<button class="modal-close" type="button" onclick={closeSettings} aria-label="閉じる">
					<IconX size={16} />
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
							aria-label={item.label}
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
				{/each}

				{#if pushSupported}
					<div class="modal-divider"></div>
					<div class="modal-item">
						<span class="modal-label">
							試合結果の通知を受け取る
							{#if pushLoading}
								<span class="modal-label-sub">(処理中...)</span>
							{/if}
						</span>
						<button
							type="button"
							class="toggle"
							class:active={pushEnabled}
							onclick={handlePushToggle}
							role="switch"
							aria-checked={pushEnabled}
							aria-label="試合結果の通知を受け取る"
							disabled={pushLoading}
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
				{/if}
			</div>
			<div class="modal-footer">
				<Button variant="secondary" onclick={handleNotification}>Test</Button>
				<Button variant="secondary" onclick={handleSave}>保存</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(3, 0, 10, 0.4);
		backdrop-filter: blur(5px);
		z-index: 10;
	}

	.modal-dismiss {
		position: absolute;
		inset: 0;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
	}

	.modal {
		position: relative;
		z-index: 1;
		width: 420px;
		max-width: calc(100% - 40px);
		background: #201e3a;
		border-radius: 4px;
		padding: 20px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 16px;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.modal-close {
		border: none;
		background: rgba(148, 168, 255, 0.1);
		color: #fff;
		border-radius: 9999px;
		padding: 6px;
		display: grid;
		place-items: center;
		cursor: pointer;
		transition: background 150ms ease, color 150ms ease;
	}

	.modal-close :global(svg) {
		transition: transform 200ms ease;
	}

	.modal-close:hover :global(svg) {
		transform: rotate(90deg);
	}

	.modal-close:hover {
		background: rgba(148, 168, 255, 0.2);
		color: #fff;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.modal-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 10px;
		border-radius: 4px;
		background: rgba(148, 168, 255, 0.05);
	}

	.modal-divider {
		height: 1px;
		background: rgba(148, 168, 255, 0.1);
		margin: 2px 0;
	}

	.modal-label {
		font-size: 0.9rem;
		color: #cfcfcf;
	}

	.modal-label-sub {
		font-size: 0.8rem;
		color: #8888aa;
	}

	.toggle {
		position: relative;
		flex-shrink: 0;
		width: 44px;
		height: 24px;
		background: rgba(148, 168, 255, 0.1);
		border-radius: 999px;
		padding: 2px;
		cursor: pointer;
		transition: background 200ms ease;
	}

	.toggle-knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 18px;
		height: 18px;
		background: #8888aa;
		border-radius: 50%;
		transition: transform 200ms ease, background 200ms ease;
	}

	.toggle.active {
		background: rgba(148, 168, 255, 0.25);
	}

	.toggle.active .toggle-knob {
		transform: translateX(20px);
		background: #b9c4ff;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 16px;
	}
</style>
