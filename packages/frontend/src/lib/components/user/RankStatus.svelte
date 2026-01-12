<script lang="ts">
import type { RankStatusT } from '@midnight-network/shared/rpc/user/models';
import { animate } from 'motion';
import GaugeBar from '$lib/components/ui/GaugeBar.svelte';

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
	{ label: '累計ポイント', value: `${rankStatus.totalPt.toLocaleString()}pt` },
	{ label: '連続参加日数', value: `${rankStatus.streakParticipationAt}` },
	{ label: '連続未参加日数', value: `${rankStatus.streakAbsenceAt}` },
	{ label: '連続ランクイン回数', value: `${rankStatus.streakWithinTopAt}` },
	{ label: '連続フライング回数', value: `${rankStatus.streakFlyingAt}` },
	{
		label: 'プロテクトクールタイム',
		value: rankStatus.protectCoolTime > 0 ? `回復まで残り${rankStatus.protectCoolTime}回` : '回復済み',
		isGauge: true,
	},
]);
</script>

<div class="status" bind:this={containerElement}>
	{#if isLoading}
		<div class="status-skeleton">
			{#each Array(6) as _, i (i)}
				<div class="status-skeleton-item"></div>
			{/each}
		</div>
	{:else}
		<h3 class="status-title">ランクステータス</h3>
		<div class="status-list">
			{#each statusItems as item (item.label)}
				<div class="status-item" class:status-item-gauge={item.isGauge}>
					<span class="status-label">{item.label}</span>
					{#if item.isGauge}
						<div class="status-gauge">
							<GaugeBar value={100} text={item.value} textPosition="center" />
						</div>
					{:else}
						<span class="status-value">{item.value}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.status {
		padding: 20px;
		background: #201E3A;
		border-radius: 5px;
		color: #fff;
	}

	.status-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 10px;
	}

	.status-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.93rem;
	}

	.status-label {
		color: #c6c9df;
	}

	.status-value {
		font-weight: 600;
	}

	.status-item.status-item-gauge {
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		margin-top: 10px;
	}

	.status-gauge {
		width: 100%;
	}

	.status-skeleton {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.status-skeleton-item {
		height: 25px;
		border-radius: 10px;
		background: #2f2d4a;
	}
</style>
