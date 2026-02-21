<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import { onErrorImageDisplayNone } from '$lib/utils/style';

/**
 * ランクバッジコンポーネント
 * @description ユーザーアイコンの右下に表示するランクバッジ
 */

interface Props {
	rank: number;
	class?: string;
	style?: string;
}

const { rank, class: className = '', style = '' }: Props = $props();
</script>

<div class={`rank-badge ${className}`.trim()} {style}>
	{#if rank !== RankType.NoRank}
		<img src="/rank/budge/{rank}.png" alt="Rank badge" class="rank-badge-image" onerror={(e) => onErrorImageDisplayNone(e.currentTarget)} />
	{/if}
</div>

<style>
	.rank-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.rank-badge-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
