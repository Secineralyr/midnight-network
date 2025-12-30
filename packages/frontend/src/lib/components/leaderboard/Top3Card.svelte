<script lang="ts">
import { animate } from 'motion';
import { formatPlace, formatPt, formatTimeDiff } from '$lib/utils/format';
import type { RankTypeValue } from '$lib/utils/rank';
import RankIcon from '../rank/RankIcon.svelte';

/**
 * トップ3カードコンポーネント
 * @description リーダーボードのトップ3プレイヤーを表示するカード
 */

/** カードのタイプ */
type CardType = 'time' | 'pt';

interface Props {
	/** 順位 */
	place: number;
	/** ユーザー名 */
	username: string;
	/** アバターURL */
	avatarUrl?: string;
	/** ランク値 */
	rank: RankTypeValue;
	/** タイム（time タイプ用） */
	time?: number;
	/** ポイント（pt タイプ用） */
	pt?: number;
	/** カードタイプ */
	type: CardType;
	/** スケルトン表示 */
	isLoading?: boolean;
	/** クリックハンドラ */
	onclick?: () => void;
}

const { place, username, avatarUrl, rank, time, pt, type, isLoading = false, onclick }: Props = $props();

let cardElement: HTMLButtonElement | undefined = $state();

$effect(() => {
	if (cardElement && !isLoading) {
		animate(cardElement, { opacity: [0, 1], y: [20, 0] }, { duration: 0.4, delay: place * 0.1 });
	}
});

/**
 * ホバー開始時のアニメーション
 */
function handleMouseEnter(): void {
	if (cardElement && !isLoading) {
		animate(cardElement, { scale: 1.02 }, { duration: 0.15 });
	}
}

/**
 * ホバー終了時のアニメーション
 */
function handleMouseLeave(): void {
	if (cardElement && !isLoading) {
		animate(cardElement, { scale: 1 }, { duration: 0.15 });
	}
}

/**
 * クリック時のアニメーション
 */
function handleClick(): void {
	if (cardElement && !isLoading) {
		animate(cardElement, { scale: [1, 0.98, 1] }, { duration: 0.2 });
	}
	onclick?.();
}

/** 値の表示テキスト */
const valueText = $derived(type === 'time' && time !== undefined ? formatTimeDiff(time) : pt !== undefined ? formatPt(pt) : '');
</script>

<button
	bind:this={cardElement}
	type="button"
	class="top3-card"
	class:top3-card--loading={isLoading}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	disabled={isLoading}
>
	{#if isLoading}
		<div class="top3-card__skeleton">
			<div class="skeleton top3-card__skeleton-place"></div>
			<div class="skeleton top3-card__skeleton-avatar"></div>
			<div class="skeleton top3-card__skeleton-info"></div>
			<div class="skeleton top3-card__skeleton-rank"></div>
		</div>
	{:else}
		<span class="top3-card__place font-alphanumeric">{formatPlace(place)}</span>
		<img
			src={avatarUrl || '/images/default-avatar.png'}
			alt={username}
			class="top3-card__avatar"
		/>
		<div class="top3-card__info">
			<span class="top3-card__username font-alphanumeric">@{username}</span>
			<span class="top3-card__value font-alphanumeric">{valueText}</span>
		</div>
		<div class="top3-card__rank">
			<RankIcon {rank} size="md" />
		</div>
	{/if}
</button>

<style>
	.top3-card {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-xl);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);
		width: 100%;
		text-align: left;
	}

	.top3-card:hover:not(.top3-card--loading) {
		background-color: var(--color-bg-card-hover);
		border-color: var(--color-border-focus);
	}

	.top3-card--loading {
		cursor: default;
	}

	.top3-card__place {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-secondary);
		min-width: 40px;
	}

	.top3-card__avatar {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		object-fit: cover;
		border: 2px solid var(--color-border-secondary);
	}

	.top3-card__info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.top3-card__username {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.top3-card__value {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.top3-card__rank {
		flex-shrink: 0;
	}

	/* スケルトン */
	.top3-card__skeleton {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		width: 100%;
	}

	.top3-card__skeleton-place {
		width: 40px;
		height: 24px;
		border-radius: var(--radius-sm);
	}

	.top3-card__skeleton-avatar {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
	}

	.top3-card__skeleton-info {
		flex: 1;
		height: 40px;
		border-radius: var(--radius-md);
	}

	.top3-card__skeleton-rank {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
	}
</style>
