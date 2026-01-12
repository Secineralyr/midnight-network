<script lang="ts">
import { RankType } from '@midnight-network/shared/rank';
import { getRankGrade, type RankTypeValue } from '$lib/utils/rank';

/**
 * ランクアイコンコンポーネント
 * @description ランクに応じた砂時計アイコンを表示
 */

interface Props {
	rank: RankTypeValue;
	class?: string;
	style?: string;
}

const { rank, class: className = '', style = '' }: Props = $props();

const grade = $derived(getRankGrade(rank));
</script>

<div class={`rank-icon rank-icon--${grade} ${className}`.trim()} {style}>
	{#if rank !== RankType.NoRank}
		<img src="/rank/time/{rank}.png" alt="Rank {grade}" class="rank-icon-image" />
	{:else}
		<img src="/rank/time/nr.png" alt="No Rank" class="rank-icon-image" />
	{/if}
</div>

<style>
	.rank-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.rank-icon-image {
		height: 100%;
		width: auto;
		max-width: 100%;
		max-height: 100%;
		display: block;
		object-fit: contain;
	}

	.rank-icon--tachyon:hover .rank-icon-image {
		filter: drop-shadow(0 0 10px #00CDE860)
			drop-shadow(0 0 20px #B160EB60);
	}

	.rank-icon--luminal:hover .rank-icon-image {
		filter: drop-shadow(0 0 10px #fff6);
	}

	.rank-icon--gold:hover .rank-icon-image {
		filter: drop-shadow(0 0 10px #FFD50060);
	}

	.rank-icon--silver:hover .rank-icon-image {
		filter: drop-shadow(0 0 10px #CCCCCC60);
	}

	.rank-icon--bronze:hover .rank-icon-image {
		filter: drop-shadow(0 0 10px #E6964560);
	}
</style>
