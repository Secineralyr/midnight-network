<!-- SPDX-FileCopyrightText: 2026 Secineralyr -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
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

	@keyframes rank-glow-pulse {
		0%,
		100% {
			filter: drop-shadow(0 0 var(--glow-size-min) var(--glow-color-primary))
				drop-shadow(0 0 var(--glow-size-outer-min, 0px) var(--glow-color-secondary, transparent));
		}
		50% {
			filter: drop-shadow(0 0 var(--glow-size-max) var(--glow-color-primary))
				drop-shadow(0 0 var(--glow-size-outer-max, 0px) var(--glow-color-secondary, transparent));
		}
	}

	.rank-icon--tachyon {
		--glow-color-primary: #00CDE860;
		--glow-color-secondary: #B160EB60;
		--glow-size-min: 4px;
		--glow-size-max: 10px;
		--glow-size-outer-min: 8px;
		--glow-size-outer-max: 20px;
	}

	.rank-icon--tachyon .rank-icon-image {
		animation: rank-glow-pulse 4s ease-in-out infinite;
	}

	.rank-icon--luminal {
		--glow-color-primary: #fff6;
		--glow-size-min: 4px;
		--glow-size-max: 10px;
	}

	.rank-icon--luminal .rank-icon-image {
		animation: rank-glow-pulse 4.5s ease-in-out infinite;
	}

	.rank-icon--gold {
		--glow-color-primary: #FFD50060;
		--glow-size-min: 4px;
		--glow-size-max: 10px;
	}

	.rank-icon--gold .rank-icon-image {
		animation: rank-glow-pulse 5s ease-in-out infinite;
	}

	.rank-icon--silver {
		--glow-color-primary: #CCCCCC60;
		--glow-size-min: 4px;
		--glow-size-max: 10px;
	}

	.rank-icon--silver .rank-icon-image {
		animation: rank-glow-pulse 5.5s ease-in-out infinite;
	}

	.rank-icon--bronze {
		--glow-color-primary: #E6964560;
		--glow-size-min: 4px;
		--glow-size-max: 10px;
	}

	.rank-icon--bronze .rank-icon-image {
		animation: rank-glow-pulse 5.5s ease-in-out infinite;
	}
</style>
