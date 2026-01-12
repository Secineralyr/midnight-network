<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import type { RankTypeValue } from '$lib/utils/rank';

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
		<img src="/rank/budge/{rank}.png" alt="Rank badge" class="rank-badge-image" />
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
