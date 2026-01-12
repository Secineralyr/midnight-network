<script lang="ts">
import type { BasicTableResponseDataT, PreviouslyTableResponseDataT } from '@midnight-network/shared/rpc/leaderboard/models';
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
			if ('previousPlace' in row) {
				return formatPlaceChange(row.place, row.previousPlace);
			} else {
				return '-';
			}
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
</script>

<div class="table-root">
	<div class="table-header">
		<span class="table-header-cell">順位</span>
		<span class="table-header-cell">前日比</span>
		<span class="table-header-cell table-header-cell-wide">名前</span>
		<span class="table-header-cell">WR</span>
		<span class="table-header-cell">Avg</span>
		<span class="table-header-cell">pt</span>
		<span class="table-header-cell">ランク</span>
	</div>
	{#if isLoading}
		<div class="table-skeleton">
			{#each Array(10) as _, i (i)}
				<div class="table-skeleton-row"></div>
			{/each}
		</div>
	{:else}
		{#if myRanking}
			<div class="table-highlight">
				<button
					type="button"
					class="table-row"
					class:highlighted={true}
					onclick={() => handleRowClick(myRanking.user.username)}
				>
					<span class="table-cell">{formatPlace(myRanking.place)}</span>
					<span class="table-cell">{formatPlaceChange(myRanking.place, myRanking.previousPlace)}</span>
					<img
						src="https://placehold.co/400"
						alt={myRanking.user.username}
						class="avatar"
					/>
					<span class="table-cell name">@{myRanking.user.username}</span>
					<span class="table-cell">{formatWinRate(myRanking.wr)}</span>
					<span class="table-cell">{formatAvgTime(myRanking.averageTime)}</span>
					<span class="table-cell">{formatPt(myRanking.totalPt)}</span>
					<div class="table-rank">
						<RankIcon rank={myRanking.rank} />
					</div>
				</button>
			</div>
		{/if}
		<div class="table-list">
			{#each table.getRowModel().rows as row (row.id)}
				{@const rowData = row.original}
				<button
					type="button"
					class="table-row"
					onclick={() => handleRowClick(rowData.user.username)}
				>
					<span class="table-cell">{formatPlace(rowData.place)}</span>
					<span class="table-cell">{formatPlaceChange(rowData.place, rowData.previousPlace)}</span>
					<img
						src="https://placehold.co/400"
						alt={rowData.user.username}
						class="avatar"
					/>
					<span class="table-cell name">@{rowData.user.username}</span>
					<span class="table-cell">{formatWinRate(rowData.wr)}</span>
					<span class="table-cell">{formatAvgTime(rowData.averageTime)}</span>
					<span class="table-cell">{formatPt(rowData.totalPt)}</span>
					<div class="table-rank">
						<RankIcon rank={rowData.rank} />
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.table-root {
		width: 100%;
		color: #ffffff;
		font-size: 14px;
	}

	.table-header {
		display: grid;
		grid-template-columns: 50px 80px 40px 1fr 80px 80px 80px 40px;
		gap: 10px;
		padding: 10px 20px;
		color: #fff;
		font-size: 0.875rem;
		font-family: 'M PLUS 2', sans-serif;
		border-bottom: 1px solid #d3d3d3;
		margin-bottom: 10px;
	}

	.table-header-cell {
		white-space: nowrap;
	}

	.table-header-cell-wide {
		grid-column: span 2;
	}

	.table-highlight {
		margin-bottom: 12px;
	}

	.table-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.table-row {
		display: grid;
		grid-template-columns: 60px 60px 40px 1fr 80px 80px 80px 40px;
		align-items: center;
		gap: 10px;
		padding: 10px 20px;
		background: #201E3A;
		border-radius: 5px;
		text-align: left;
		transition: background 0.15s ease;
	}

	.table-row:hover {
		background: #323054;
	}

	.table-row.highlighted {
		background: #343259;
	}

	.table-cell {
		white-space: nowrap;
	}

	.table-cell.name {
		font-size: 1rem;
		font-weight: 600;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.18);
		object-fit: cover;
	}

	.table-rank {
		display: flex;
		justify-content: center;
	}

	.table-rank :global(.rank-icon) {
		width: 32px;
	}

	.table-skeleton {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.table-skeleton-row {
		height: 52px;
		border-radius: 12px;
		background: #2f2d4a;
	}

	@media (max-width: 768px) {
		.table-header {
			display: none;
		}

		.table-row {
			grid-template-columns: 40px 40px 32px 1fr 60px 40px;
		}

		.table-cell:nth-child(5),
		.table-cell:nth-child(6) {
			display: none;
		}
	}
</style>
