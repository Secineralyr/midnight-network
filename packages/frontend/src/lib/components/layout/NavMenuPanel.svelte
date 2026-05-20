<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { IconBadges, IconHome, IconListNumbers } from '@tabler/icons-svelte';
import { fly } from 'svelte/transition';

interface Props {
	/** パネルを閉じるハンドラ */
	onClose: () => void;
}

const { onClose }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="panel" transition:fly={{ y: -10, duration: 200 }}>
	<div class="panel-actions">
		<a href="/" class="panel-action" onclick={onClose}>
			<IconHome size={16} stroke={3} />
			<span class="panel-text">ホーム</span>
		</a>
		<a href="/leaderboard" class="panel-action" onclick={onClose}>
			<IconListNumbers size={16} stroke={3} />
			<span class="panel-text">リーダーボード</span>
		</a>
		<a href="/ranksystem" class="panel-action" onclick={onClose}>
			<IconBadges size={16} stroke={3} />
			<span class="panel-text">ランクシステムについて</span>
		</a>
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

	.panel-actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 5px;
	}

	.panel-action {
		display: flex;
		align-items: center;
		gap: 5px;
		font-weight: 600;
		transition: opacity 0.15s ease;
		white-space: nowrap;
	}

	.panel-action:hover {
		opacity: 0.85;
	}
</style>
