<script lang="ts">
import type { LastResultResponseT } from '@midnight-network/shared/rpc/me/models';
import { RankShiftType } from '@midnight-network/shared/rpc/me/models';
import { animate } from 'motion';
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

let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement && !isLoading) {
		animate(containerElement, { opacity: [0, 1], y: [20, 0] }, { duration: 0.4 });
	}
});

/** ランクアップ判定 */
const isRankUp = $derived(result.rankShift === RankShiftType.RankUp);

/** ランクダウン判定 */
const isRankDown = $derived(result.rankShift === RankShiftType.RankDown);
</script>

<div class="result" bind:this={containerElement}>
	{#if isLoading}
		<div class="result-skeleton">
			<div class="result-skeleton-title"></div>
			<div class="result-skeleton-content"></div>
		</div>
	{:else}
		<div class="result-header">
			<h3 class="result-title">前回のリザルト</h3>
			<span class="result-date">({formatDate(result.targetDate)})</span>
		</div>
		<div class="result-content">
			<div class="result-stats">
				<div class="result-stat">
					<span class="result-label">順位</span>
					<span class="result-value result-place">{result.place}</span>
				</div>
				<div class="result-stat">
					<span class="result-label">タイム</span>
					<span class="result-value">{formatTimeDiff(result.time)}</span>
				</div>
				<div class="result-stat">
					<span class="result-label">獲得pt</span>
					<span class="result-value">{result.earnedPt >= 0 ? '+' : ''}{result.earnedPt}</span>
				</div>
				<div class="result-total">
					<span class="result-total-value">= {formatPt(result.latestTotalPt)}</span>
					{#if isRankUp}
						<span class="result-shift up">Rank up!</span>
					{:else if isRankDown}
						<span class="result-shift down">Rank down</span>
					{/if}
				</div>
			</div>
			<div class="result-rank">
				<RankIcon rank={result.latestRank} />
			</div>
		</div>
	{/if}
</div>

<style>
	.result {
		padding: 24px 28px;
		background: #23213a;
		border-radius: 18px;
		color: #ffffff;
		box-shadow: 0 18px 30px rgba(7, 6, 16, 0.4);
	}

	.result-header {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 20px;
	}

	.result-title {
		font-size: 20px;
		font-weight: 600;
	}

	.result-date {
		font-size: 14px;
		color: #c6c9df;
	}

	.result-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 24px;
	}

	.result-stats {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.result-stat {
		display: flex;
		align-items: baseline;
		gap: 16px;
	}

	.result-label {
		font-size: 15px;
		color: #c6c9df;
		min-width: 60px;
	}

	.result-value {
		font-size: 22px;
		font-weight: 600;
	}

	.result-place {
		color: #f2c35b;
	}

	.result-total {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 6px;
	}

	.result-total-value {
		font-size: 32px;
		font-weight: 700;
	}

	.result-shift {
		font-size: 16px;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.result-shift.up {
		color: #7cf17a;
	}

	.result-shift.down {
		color: #ff6b6b;
	}

	.result-rank {
		flex-shrink: 0;
		filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.35));
	}

	.result-rank :global(.rank-icon) {
		width: 80px;
	}

	.result-skeleton {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.result-skeleton-title {
		width: 200px;
		height: 28px;
		border-radius: 10px;
		background: #2f2d4a;
	}

	.result-skeleton-content {
		width: 100%;
		height: 140px;
		border-radius: 12px;
		background: #2f2d4a;
	}

	@media (max-width: 768px) {
		.result-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.result-rank {
			align-self: center;
		}
	}
</style>
