<script lang="ts">
import type { LastResultResponseT } from '@midnight-network/shared/rpc/me/models';
import { RankShiftType } from '@midnight-network/shared/rpc/me/models';
import { IconArrowBadgeDown, IconArrowBadgeUp } from '@tabler/icons-svelte';
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
	{#if !isLoading}
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
						<span class="result-shift up"><span class="result-shift-left"><IconArrowBadgeUp /></span>Rank up!<span class="result-shift-right"><IconArrowBadgeUp /></span></span>
					{:else if isRankDown}
						<span class="result-shift down"><span class="result-shift-left"><IconArrowBadgeDown /></span>Rank down<span class="result-shift-right"><IconArrowBadgeDown /></span></span>
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

	.result-place {
		color: #f2c35b;
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

	.result-rank {
		flex-shrink: 0;
	}

	.result-rank {
		height: 150px;
	}
</style>
