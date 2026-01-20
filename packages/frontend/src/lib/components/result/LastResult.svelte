<script lang="ts">
import type { LastResultResponseT } from '@midnight-network/shared/rpc/me/models';
import { RankShiftType } from '@midnight-network/shared/rpc/me/models';
import { IconArrowBadgeDown, IconArrowBadgeUp } from '@tabler/icons-svelte';
import { animate, stagger } from 'motion';
import { cubicOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';
import { fade, fly } from 'svelte/transition';
import { formatDate, formatPlace, formatPt, formatTimeDiff } from '$lib/utils/format';
import RankIcon from '../rank/RankIcon.svelte';

/**
 * 前回のリザルトコンポーネント
 * @description ログインユーザーの前回の試合結果を表示
 */

interface Props {
	/** リザルトデータ */
	result: NonNullable<LastResultResponseT>;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { result, isLoading = false }: Props = $props();

/** ランクアップ判定 */
const isRankUp = $derived(result.rankShift === RankShiftType.RankUp);

/** ランクダウン判定 */
const isRankDown = $derived(result.rankShift === RankShiftType.RankDown);

/** 順位に応じた色 */
const placeColor = $derived.by(() => {
	switch (result.place) {
		case 1:
			return '#FEB369';
		case 2:
			return '#CCCCCC';
		case 3:
			return '#C26330';
		default:
			return '#fff';
	}
});

/** DOM参照 */
let statsContainer: HTMLElement = $state();
let rankContainer: HTMLElement = $state();

/** 数値カウントアップアニメーション用Tween */
const placeTween = new Tween(0, { easing: cubicOut });
const timeTween = new Tween(0, { easing: cubicOut });
const earnedPtTween = new Tween(0, { easing: cubicOut });
const totalPtTween = new Tween(0, { easing: cubicOut });

/** データロード完了時にアニメーション開始 */
$effect(() => {
	if (!isLoading && statsContainer) {
		// カウントアップアニメーション
		placeTween.set(result.place, { duration: 1000, delay: 600 });
		timeTween.set(result.time, { duration: 1000, delay: 1000 });
		earnedPtTween.set(result.earnedPt, { duration: 1000, delay: 1400 });
		totalPtTween.set(result.latestTotalPt, { duration: 2000, delay: 1800 });

		// 順次フェードインアニメーション（親カードのfly完了後）
		animate(
			statsContainer.querySelectorAll('.result-stat, .result-total, .result-shift'),
			{ opacity: [0, 1], y: [10, 0] },
			{ duration: 0.4, delay: stagger(0.4, { startDelay: 0.6 }) },
		);
		animate(rankContainer, { opacity: [0, 1] }, { duration: 0.4, delay: 2.2 });
	}
});
</script>

<div class="result" in:fly={{ y: 20, duration: 400 }}>
	<div class="result-header">
		<h3 class="result-title" class:skeleton={isLoading}>
			{#if !isLoading}前回のリザルト{/if}
		</h3>
		<span class="result-date" class:skeleton={isLoading}>
			{#if !isLoading}({formatDate(result.targetDate)}){/if}
		</span>
	</div>
	<div class="result-content">
		<div class="result-stats" bind:this={statsContainer}>
			<div class="result-stat">
				<span class="result-label" class:skeleton={isLoading}>
					{#if !isLoading}順位{/if}
				</span>
				<span class="result-value result-place" class:skeleton={isLoading} style:color={isLoading ? undefined : placeColor}>
					{#if !isLoading}{Math.round(placeTween.current)}{/if}
				</span>
			</div>
			<div class="result-stat">
				<span class="result-label" class:skeleton={isLoading}>
					{#if !isLoading}タイム{/if}
				</span>
				<span class="result-value" class:skeleton={isLoading}>
					{#if !isLoading}{formatTimeDiff(timeTween.current)}{/if}
				</span>
			</div>
			<div class="result-stat">
				<span class="result-label" class:skeleton={isLoading}>
					{#if !isLoading}獲得pt{/if}
				</span>
				<span class="result-value" class:skeleton={isLoading}>
					{#if !isLoading}{Math.round(earnedPtTween.current) >= 0 ? '+' : ''}{Math.round(earnedPtTween.current)}{/if}
				</span>
			</div>
			<div class="result-total">
				<span class="result-total-value" class:skeleton={isLoading}>
					{#if !isLoading}= {formatPt(Math.round(totalPtTween.current))}{/if}
				</span>
				{#if !isLoading && isRankUp}
					<span class="result-shift up" in:fade={{ delay: 1000, duration: 300 }}>
						<span class="result-shift-left"><IconArrowBadgeUp /></span>
						Rank up!
						<span class="result-shift-right"><IconArrowBadgeUp /></span>
					</span>
				{:else if !isLoading && isRankDown}
					<span class="result-shift down" in:fade={{ delay: 1000, duration: 300 }}>
						<span class="result-shift-left"><IconArrowBadgeDown /></span>
						Rank down
						<span class="result-shift-right"><IconArrowBadgeDown /></span>
					</span>
				{/if}
			</div>
		</div>
		<div class="result-rank" class:skeleton={isLoading} bind:this={rankContainer}>
			{#if !isLoading}<RankIcon rank={result.latestRank} />{/if}
		</div>
	</div>
</div>

<style>
	.result {
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		color: #fff;
	}

	.result-header {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.result-title {
		font-size: 1.3rem;
		font-weight: 600;
	}

	.result-date {
		font-size: 0.9rem;
		color: #fff;
	}

	.result-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		padding: 20px;
	}

	.result-stats {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.result-stat {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.result-label {
		font-size: 1rem;
		color: #fff;
		min-width: 60px;
	}

	.result-value {
		font-size: 1.4rem;
		font-weight: 400;
		font-family: 'Michroma', sans-serif;
	}

	.result-total {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-left: 70px;
	}

	.result-total-value {
		font-size: 1.7rem;
		font-weight: 400;
		font-family: 'Michroma', sans-serif;
	}

	.result-shift {
		position: absolute;
		right: -30px;
		bottom: -1rem;
		font-size: 1.1rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
	}

	.result-shift.up {
		color: #89FF7E;
	}

	.result-shift.down {
		color: #ff7e84;
	}

	.result-shift-left {
		position: relative;
		top: 10px;
		left: 5px;
		display: flex;
	}

	.result-shift-right {
		position: relative;
		bottom: 5px;
		right: 5px;
		display: flex;
	}

	/* Rank Up: 下から上にフェードイン→停止→上にフェードアウト */
	.result-shift.up .result-shift-left,
	.result-shift.up .result-shift-right {
		animation: float-up 1.5s ease-in-out infinite;
	}

	.result-shift.up .result-shift-right {
		animation-delay: 50ms;
	}

	/* Rank Down: 上から下にフェードイン→停止→下にフェードアウト */
	.result-shift.down .result-shift-left,
	.result-shift.down .result-shift-right {
		animation: float-down 1.5s ease-in-out infinite;
	}

	.result-shift.down .result-shift-right {
		animation-delay: 50ms;
	}

	@keyframes float-up {
		0% {
			opacity: 0;
			transform: translateY(8px);
		}
		20% {
			opacity: 1;
			transform: translateY(0);
		}
		40% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-8px);
		}
	}

	@keyframes float-down {
		0% {
			opacity: 0;
			transform: translateY(-8px);
		}
		20% {
			opacity: 1;
			transform: translateY(0);
		}
		40% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	.result-rank {
		flex-shrink: 0;
	}

	.result-rank {
		height: 150px;
	}

	/* モバイル表示 */
	@media (max-width: 899px) {
		.result {
			padding: 15px;
		}
		.result-header {
			flex-direction: column;
			gap: 5px;
			align-items: flex-start;
		}
		.result-title {
			font-size: 1.1rem;
		}
		.result-date {
			font-size: 0.8rem;
		}
		.result-content {
			gap: 20px;
			padding: 15px 10px;
			align-items: center;
		}
		.result-label {
			font-size: 0.9rem;
			min-width: 50px;
		}
		.result-value {
			font-size: 1.2rem;
		}
		.result-total {
			justify-content: center;
			flex-direction: column;
			align-items: center;
		}
		.result-total-value {
			font-size: 1.4rem;
		}
		.result-shift {
			font-size: 1rem;
		}
	}

	@media (max-width: 449px) {
		.result-content {
			flex-direction: column;
		}
		.result-rank {
			margin-top: 20px;
		}
	}
</style>
