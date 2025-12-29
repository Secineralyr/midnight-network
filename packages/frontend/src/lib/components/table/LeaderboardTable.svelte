<script lang="ts">
import type { PreviouslyTableResponseDataT } from '@midnight-network/shared/rpc/leaderboard/models';
import type { ColumnDef } from '@tanstack/svelte-table';
import { createTable, getCoreRowModel } from '@tanstack/svelte-table';
import { animate } from 'motion';
import { formatAvgTime, formatPlace, formatPlaceChange, formatPt, formatWinRate } from '$lib/utils/format';
import RankIcon from '../rank/RankIcon.svelte';

/**
 * リーダーボードテーブルコンポーネント
 * @description ランキング一覧を表示するテーブル
 */

interface Props {
	/** テーブルデータ */
	data: PreviouslyTableResponseDataT[];
	/** 自分のランキングデータ */
	myRanking?: PreviouslyTableResponseDataT | null;
	/** ローディング状態 */
	isLoading?: boolean;
	/** 行クリックハンドラ */
	onRowClick?: (username: string) => void;
}

const { data, myRanking, isLoading = false, onRowClick }: Props = $props();

let tableElement: HTMLTableElement | undefined = $state();

$effect(() => {
	if (tableElement && !isLoading) {
		animate(tableElement, { opacity: [0, 1] }, { duration: 0.3 });
	}
});

/** カラム定義 */
const columns: ColumnDef<PreviouslyTableResponseDataT>[] = [
	{
		accessorKey: 'place',
		header: '順位',
		cell: (info) => formatPlace(info.getValue() as number),
	},
	{
		accessorKey: 'previousPlace',
		header: '前日比',
		cell: (info) => {
			const row = info.row.original;
			return formatPlaceChange(row.place, row.previousPlace);
		},
	},
	{
		accessorKey: 'user',
		header: '名前',
		cell: (info) => {
			const user = info.getValue() as PreviouslyTableResponseDataT['user'];
			return `@${user.username}`;
		},
	},
	{
		accessorKey: 'wr',
		header: 'WR',
		cell: (info) => formatWinRate(info.getValue() as number),
	},
	{
		accessorKey: 'averageTime',
		header: 'Avg',
		cell: (info) => formatAvgTime(info.getValue() as number),
	},
	{
		accessorKey: 'totalPt',
		header: 'pt',
		cell: (info) => formatPt(info.getValue() as number),
	},
	{
		accessorKey: 'rank',
		header: 'ランク',
		cell: () => null,
	},
];

/** テーブルインスタンス */
const table = createTable({
	get data() {
		return data;
	},
	columns,
	getCoreRowModel: getCoreRowModel(),
});

/**
 * 行クリックハンドラ
 * @param username - ユーザー名
 */
function handleRowClick(username: string): void {
	onRowClick?.(username);
}

/**
 * 行ホバー開始ハンドラ
 * @param row - 行要素
 */
function handleRowMouseEnter(row: HTMLButtonElement): void {
	animate(row, { backgroundColor: 'rgba(45, 51, 71, 0.5)' }, { duration: 0.15 });
}

/**
 * 行ホバー終了ハンドラ
 * @param row - 行要素
 */
function handleRowMouseLeave(row: HTMLButtonElement): void {
	animate(row, { backgroundColor: 'transparent' }, { duration: 0.15 });
}
</script>

<div class="leaderboard-table">
	{#if isLoading}
		<div class="leaderboard-table__skeleton">
			{#each Array(10) as _, i (i)}
				<div class="skeleton leaderboard-table__skeleton-row"></div>
			{/each}
		</div>
	{:else}
		{#if myRanking}
			<div class="leaderboard-table__my-ranking">
				<button
					type="button"
					class="leaderboard-table__row leaderboard-table__row--highlight"
					onclick={() => handleRowClick(myRanking.user.username)}
				>
					<span class="leaderboard-table__cell font-alphanumeric">{formatPlace(myRanking.place)}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatPlaceChange(myRanking.place, myRanking.previousPlace)}</span>
					<img
						src="/images/default-avatar.png"
						alt={myRanking.user.username}
						class="leaderboard-table__avatar"
					/>
					<span class="leaderboard-table__cell leaderboard-table__cell--name font-alphanumeric">@{myRanking.user.username}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatWinRate(myRanking.wr)}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatAvgTime(myRanking.averageTime)}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatPt(myRanking.totalPt)}</span>
					<div class="leaderboard-table__rank">
						<RankIcon rank={myRanking.rank} size="sm" />
					</div>
				</button>
			</div>
		{/if}
		<div class="leaderboard-table__list">
			{#each table.getRowModel().rows as row (row.id)}
				{@const rowData = row.original}
				<button
					type="button"
					class="leaderboard-table__row"
					onclick={() => handleRowClick(rowData.user.username)}
					onmouseenter={(e) => handleRowMouseEnter(e.currentTarget as HTMLButtonElement)}
					onmouseleave={(e) => handleRowMouseLeave(e.currentTarget as HTMLButtonElement)}
				>
					<span class="leaderboard-table__cell font-alphanumeric">{formatPlace(rowData.place)}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatPlaceChange(rowData.place, rowData.previousPlace)}</span>
					<img
						src="/images/default-avatar.png"
						alt={rowData.user.username}
						class="leaderboard-table__avatar"
					/>
					<span class="leaderboard-table__cell leaderboard-table__cell--name font-alphanumeric">@{rowData.user.username}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatWinRate(rowData.wr)}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatAvgTime(rowData.averageTime)}</span>
					<span class="leaderboard-table__cell font-alphanumeric">{formatPt(rowData.totalPt)}</span>
					<div class="leaderboard-table__rank">
						<RankIcon rank={rowData.rank} size="sm" />
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.leaderboard-table {
		width: 100%;
	}

	.leaderboard-table__my-ranking {
		margin-bottom: var(--spacing-md);
	}

	.leaderboard-table__list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.leaderboard-table__row {
		display: grid;
		grid-template-columns: 60px 60px 40px 1fr 80px 80px 80px 40px;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: border-color var(--transition-fast);
		width: 100%;
		text-align: left;
	}

	.leaderboard-table__row:hover {
		border-color: var(--color-border-focus);
	}

	.leaderboard-table__row--highlight {
		background-color: var(--color-bg-card-hover);
		border-color: var(--color-accent-primary);
	}

	.leaderboard-table__cell {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}

	.leaderboard-table__cell--name {
		font-weight: var(--font-weight-semibold);
	}

	.leaderboard-table__avatar {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-full);
		object-fit: cover;
	}

	.leaderboard-table__rank {
		display: flex;
		justify-content: center;
	}

	/* スケルトン */
	.leaderboard-table__skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.leaderboard-table__skeleton-row {
		height: 52px;
		border-radius: var(--radius-lg);
	}

	@media (max-width: 768px) {
		.leaderboard-table__row {
			grid-template-columns: 40px 40px 32px 1fr 60px 40px;
		}

		.leaderboard-table__cell:nth-child(5),
		.leaderboard-table__cell:nth-child(6) {
			display: none;
		}
	}
</style>
