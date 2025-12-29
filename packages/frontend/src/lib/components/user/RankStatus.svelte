<script lang="ts">
import type { RankStatusT } from '@midnight-network/shared/rpc/user/models';
import { animate } from 'motion';

/**
 * ランクステータスコンポーネント
 * @description ユーザーのランクステータス（連続参加、連続欠席など）を表示
 */

interface Props {
	/** ランクステータスデータ */
	rankStatus: RankStatusT;
	/** ローディング状態 */
	isLoading?: boolean;
}

const { rankStatus, isLoading = false }: Props = $props();

let containerElement: HTMLDivElement | undefined = $state();

$effect(() => {
	if (containerElement && !isLoading) {
		animate(containerElement, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3 });
	}
});

/** ステータス項目 */
const statusItems = $derived([
	{ label: '累計pt', value: rankStatus.totalPt.toLocaleString() },
	{ label: '連続参加', value: `${rankStatus.streakParticipationAt}日` },
	{ label: '連続欠席', value: `${rankStatus.streakAbsenceAt}日` },
	{ label: '連続上位入賞', value: `${rankStatus.streakWithinTopAt}日` },
	{ label: '連続フライング', value: `${rankStatus.streakFlyingAt}日` },
	{ label: '降格保護', value: rankStatus.protectCoolTime > 0 ? `${rankStatus.protectCoolTime}日` : 'なし' },
]);
</script>

<div class="rank-status" bind:this={containerElement}>
	{#if isLoading}
		<div class="rank-status__skeleton">
			{#each Array(6) as _, i (i)}
				<div class="skeleton rank-status__skeleton-item"></div>
			{/each}
		</div>
	{:else}
		<h3 class="rank-status__title">ランクステータス</h3>
		<div class="rank-status__list">
			{#each statusItems as item (item.label)}
				<div class="rank-status__item">
					<span class="rank-status__label">{item.label}</span>
					<span class="rank-status__value font-alphanumeric">{item.value}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.rank-status {
		padding: var(--spacing-lg);
	}

	.rank-status__title {
		font-family: var(--font-japanese);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.rank-status__list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.rank-status__item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xs) 0;
		border-bottom: 1px solid var(--color-border-secondary);
	}

	.rank-status__item:last-child {
		border-bottom: none;
	}

	.rank-status__label {
		font-family: var(--font-japanese);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.rank-status__value {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	/* スケルトン */
	.rank-status__skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.rank-status__skeleton-item {
		height: 28px;
		border-radius: var(--radius-md);
	}
</style>
