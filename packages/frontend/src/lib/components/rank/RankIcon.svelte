<script lang="ts">
import { getRankGrade, type RankTypeValue } from '$lib/utils/rank';

/**
 * ランクアイコンコンポーネント
 * @description ランクに応じた砂時計アイコンを表示
 */

/** アイコンサイズ */
type IconSize = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
	/** ランク値 */
	rank: RankTypeValue;
	/** アイコンサイズ */
	size?: IconSize;
}

const { rank, size = 'md' }: Props = $props();

const grade = $derived(getRankGrade(rank));

const sizeMap: Record<IconSize, number> = {
	sm: 32,
	md: 48,
	lg: 80,
	xl: 120,
};

const pixelSize = $derived(sizeMap[size]);
</script>

<div class="rank-icon rank-icon--{size} rank-icon--{grade}">
	<img
		src="/images/ranks/{grade}.png"
		alt="Rank {grade}"
		width={pixelSize}
		height={pixelSize}
		class="rank-icon__image"
	/>
</div>

<style>
	.rank-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.rank-icon__image {
		object-fit: contain;
	}

	/* サイズ別スタイル */
	.rank-icon--sm {
		width: 32px;
		height: 32px;
	}

	.rank-icon--md {
		width: 48px;
		height: 48px;
	}

	.rank-icon--lg {
		width: 80px;
		height: 80px;
	}

	.rank-icon--xl {
		width: 120px;
		height: 120px;
	}

	/* グレード別エフェクト */
	.rank-icon--tachyon .rank-icon__image {
		filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6))
			drop-shadow(0 0 20px rgba(255, 0, 255, 0.4));
	}

	.rank-icon--luminal .rank-icon__image {
		filter: drop-shadow(0 0 8px rgba(255, 107, 157, 0.5));
	}

	.rank-icon--gold .rank-icon__image {
		filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.4));
	}

	.rank-icon--silver .rank-icon__image {
		filter: drop-shadow(0 0 4px rgba(192, 192, 192, 0.3));
	}

	.rank-icon--bronze .rank-icon__image {
		filter: drop-shadow(0 0 4px rgba(205, 127, 50, 0.3));
	}
</style>
