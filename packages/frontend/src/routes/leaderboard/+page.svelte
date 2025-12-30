<script lang="ts">
import type { ApiSimpleUserInfoT } from '@midnight-network/shared/rpc/models';
import { createQuery } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import RankHistogram from '$lib/components/charts/RankHistogram.svelte';
import Top3Card from '$lib/components/leaderboard/Top3Card.svelte';
import UserSearch from '$lib/components/search/UserSearch.svelte';
import LeaderboardTable from '$lib/components/table/LeaderboardTable.svelte';
import Pagination from '$lib/components/table/Pagination.svelte';
import Select from '$lib/components/ui/Select.svelte';
import { orpc } from '$lib/orpc';

/**
 * リーダーボードページ
 * @description トップ3バー、ランク分布、ランキングテーブル
 */

/** 現在のページ */
let currentPage = $state(0);

/** 順位基準 */
let sortCriteria = $state<'rank' | 'wr' | 'avgTime' | 'matchTime'>('rank');

/** 順位基準のオプション */
const sortOptions = [
	{ label: 'ランク', value: 'rank' },
	{ label: 'WR', value: 'wr' },
	{ label: '平均タイム', value: 'avgTime' },
	{ label: '今日のタイム', value: 'matchTime' },
];

/** ランキングデータ取得 */
const rankQuery = createQuery(() => ({
	queryKey: ['leaderboard', 'rank', currentPage],
	queryFn: () => orpc.leaderboard.rank(currentPage),
}));

/** ランク分布データ取得 */
const rankHistQuery = createQuery(() => ({
	queryKey: ['leaderboard', 'rankHist', currentPage],
	queryFn: () => orpc.leaderboard.rankHistogram(currentPage),
}));

/** ランクpt上位データ */
const rankTopQuery = createQuery(() => ({
	queryKey: ['rankTop'],
	queryFn: () => orpc.rankTop(),
}));

/** 最大ページ数 */
const maxPage = $derived(rankQuery.data?.maxOffset ?? 0);

/**
 * ユーザー選択時のハンドラ
 * @param user - 選択されたユーザー
 */
function handleUserSelect(user: ApiSimpleUserInfoT): void {
	goto(`/user/${user.username}`);
}

/**
 * 行クリックハンドラ
 * @param username - ユーザー名
 */
function handleRowClick(username: string): void {
	goto(`/user/${username}`);
}

/**
 * ページ変更ハンドラ
 * @param page - ページ番号
 */
function handlePageChange(page: number): void {
	currentPage = page;
}

/**
 * ソート基準変更ハンドラ
 * @param criteria - 選択された基準
 */
function handleSortChange(criteria: string): void {
	sortCriteria = criteria as typeof sortCriteria;
}
</script>

<svelte:head>
	<title>Leaderboard - MidNight Network</title>
</svelte:head>

<div class="leaderboard-page">
	<div class="leaderboard-page__hero">
		<h1 class="leaderboard-page__title font-alphanumeric">Leaderboard</h1>
		<div class="leaderboard-page__search">
			<UserSearch onSelect={handleUserSelect} />
		</div>
	</div>

	<div class="leaderboard-page__content container">
		{#if rankTopQuery.data && rankTopQuery.data.length > 0}
			<section class="top3-section">
				<Top3Card
					place={rankTopQuery.data[0].place}
					username={rankTopQuery.data[0].user.username}
					rank={rankTopQuery.data[0].rank}
					pt={rankTopQuery.data[0].pt}
					type="pt"
					isLoading={rankTopQuery.isLoading}
					onclick={() => handleRowClick(rankTopQuery.data[0].user.username)}
				/>
			</section>
		{/if}

		<section class="histogram-section card">
			<div class="histogram-section__header">
				<span class="histogram-section__label">順位基準</span>
				<Select options={sortOptions} value={sortCriteria} onchange={handleSortChange} />
			</div>
			{#if rankHistQuery.data}
				<RankHistogram
					data={rankHistQuery.data}
					sortBy={sortCriteria}
					onSortChange={handleSortChange}
					isLoading={rankHistQuery.isLoading}
				/>
			{/if}
		</section>

		<section class="table-section">
			<div class="table-section__header">
				<span class="table-section__column">順位</span>
				<span class="table-section__column">前日比</span>
				<span class="table-section__column table-section__column--wide">名前</span>
				<span class="table-section__column">WR</span>
				<span class="table-section__column">Avg</span>
				<span class="table-section__column">pt</span>
				<span class="table-section__column">ランク</span>
			</div>
			<LeaderboardTable
				data={rankQuery.data?.data ?? []}
				myRanking={rankQuery.data?.yourRanking}
				isLoading={rankQuery.isLoading}
				onRowClick={handleRowClick}
			/>
		</section>

		{#if maxPage > 0}
			<section class="pagination-section">
				<Pagination {currentPage} {maxPage} onPageChange={handlePageChange} />
			</section>
		{/if}
	</div>
</div>

<style>
	.leaderboard-page {
		padding-bottom: var(--spacing-3xl);
	}

	.leaderboard-page__hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xl);
		padding: var(--spacing-3xl) var(--spacing-lg);
		text-align: center;
	}

	.leaderboard-page__title {
		font-size: var(--font-size-4xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
	}

	.leaderboard-page__search {
		width: 100%;
		max-width: 500px;
	}

	.leaderboard-page__content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.top3-section {
		max-width: 600px;
		margin: 0 auto;
		width: 100%;
	}

	.histogram-section {
		padding: var(--spacing-lg);
	}

	.histogram-section__header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.histogram-section__label {
		font-family: var(--font-japanese);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.table-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.table-section__header {
		display: grid;
		grid-template-columns: 60px 60px 40px 1fr 80px 80px 80px 40px;
		gap: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.table-section__column {
		font-family: var(--font-japanese);
	}

	.table-section__column--wide {
		grid-column: span 2;
	}

	.pagination-section {
		display: flex;
		justify-content: center;
		padding: var(--spacing-xl) 0;
	}

	@media (max-width: 768px) {
		.leaderboard-page__title {
			font-size: var(--font-size-2xl);
		}

		.table-section__header {
			display: none;
		}
	}
</style>
