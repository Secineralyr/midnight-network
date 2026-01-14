<script lang="ts">
import { animate } from 'motion';
import { formatPlace, formatPt, formatTimeDiff } from '$lib/utils/format';
import type { RankTypeValue } from '$lib/utils/rank';
import RankIcon from '../rank/RankIcon.svelte';
import UserAvatar from '../user/UserAvatar.svelte';

/**
 * トップ3カードコンポーネント
 * @description リーダーボードのトップ3プレイヤーを表示するカード
 */

/** カードのタイプ */
type CardType = 'time' | 'pt';

interface Props {
	/** 順位 */
	place: number;
	userId?: string;
	/** ユーザー名 */
	username: string;
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

const { place, userId, username, rank, time, pt, type, isLoading = false, onclick }: Props = $props();

let cardElement: HTMLButtonElement | undefined = $state();

$effect(() => {
	if (cardElement && !isLoading) {
		animate(cardElement, { opacity: [0, 1], y: [20, 0] }, { duration: 0.4, delay: place * 0.1 });
	}
});

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
	class="top-card"
	class:loading={isLoading}
	onclick={handleClick}
	disabled={isLoading}
>
	{#if !isLoading}
		<span class="place">{formatPlace(place)}</span>
		<div class="avatar">
			<UserAvatar {userId} alt={username} />
		</div>
		<div class="info">
			<span class="name">@{username}</span>
			<span class="value">{valueText}</span>
		</div>
		<div class="rank">
			<RankIcon {rank} />
		</div>
	{/if}
</button>

<style>
	.top-card {
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		align-items: center;
		background: #2F2D53;
		border-radius: 5px;
		text-align: left;
		transition: background 0.1s ease;
		padding: 10px;
		gap: 10px;
	}

	.top-card:hover:not(.loading) {
		background: #4E4B71;
	}

	.top-card:disabled {
		cursor: default;
		opacity: 0.7;
	}

	.place {
		font-weight: 700;
		color: #fff;
		text-align: center;
	}

	.avatar {
		width: 55px;
		height: 55px;
		border-radius: 9999px;
		overflow: hidden;
	}

	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 5px;
	}

	.name {
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.value {
		color: #fff;
		font-size: 0.85em;
	}

	.rank {
		height: 55px;
	}
</style>
