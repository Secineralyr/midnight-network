<script lang="ts">
import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { goto } from '$app/navigation';
import RankHistogram from '$lib/components/charts/RankHistogram.svelte';
import LeaderboardTable from '$lib/components/table/LeaderboardTable.svelte';
import Pagination from '$lib/components/table/Pagination.svelte';
import Select from '$lib/components/ui/Select.svelte';
import { primeMisskeyUsers } from '$lib/data/misskey-users';
import { orpc } from '$lib/orpc';

/**
 * リーダーボードページ
 * @description トップ3バー、ランク分布、ランキングテーブル
 */

/** 現在のページ（1始まり） */
const queryClient = useQueryClient();

let currentPage = $state(1);

/** 順位基準 */
let sortCriteria = $state<'rank' | 'wr' | 'avgTime' | 'matchTime'>('rank');

/** 順位基準のオプション */
const sortOptions = [
	{ label: 'ランク', value: 'rank' },
	{ label: 'WR', value: 'wr' },
	{ label: '平均タイム', value: 'avgTime' },
	{ label: '今日のタイム', value: 'matchTime' },
];

/** ソート基準に応じたAPIを呼び出す */
function fetchLeaderboard(page: number, criteria: typeof sortCriteria) {
	switch (criteria) {
		case 'rank':
			return orpc.leaderboard.rank(page);
		case 'wr':
			return orpc.leaderboard.wr(page);
		case 'avgTime':
			return orpc.leaderboard.averageTime(page);
		case 'matchTime':
			return orpc.leaderboard.matchTime(page);
		default:
			throw new Error('criteria is not supported value');
	}
}

/** ランキングデータ取得 */
const rankQuery = createQuery(() => ({
	queryKey: ['leaderboard', sortCriteria, currentPage],
	queryFn: () => fetchLeaderboard(currentPage, sortCriteria),
}));

const leaderboardUserIds = $derived([
	...(rankQuery.data?.data.map((row) => row.user.userId) ?? []),
	...(rankQuery.data?.yourRanking ? [rankQuery.data.yourRanking.user.userId] : []),
]);

$effect(() => {
	if (leaderboardUserIds.length === 0) {
		return;
	}
	primeMisskeyUsers(queryClient, leaderboardUserIds).catch(() => null);
});

/** ランク分布データ取得 */
const rankHistQuery = createQuery(() => ({
	queryKey: ['leaderboard', 'rankHist', currentPage],
	queryFn: () => orpc.leaderboard.rankHistogram(currentPage),
}));

/** 最大ページ数 */
const maxPage = $derived(rankQuery.data?.maxOffset ?? 0);

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
	currentPage = 1;
}
</script>

<svelte:head>
	<title>Leaderboard - MidNight Network</title>
</svelte:head>

<div class="leaderboard-page">
	<div class="leaderboard-page-hero">
		<h1 class="leaderboard-page-title">Leaderboard</h1>
	</div>

	<div class="leaderboard-page-content">
		{#if rankQuery.data?.yourRanking}
			<LeaderboardTable
				data={[]}
				myRanking={rankQuery.data.yourRanking}
				isLoading={rankQuery.isLoading}
				onRowClick={handleRowClick}
			/>
		{/if}

		<div>
			<div class="histogram-section-header">
				<span class="histogram-section-label">順位基準</span>
				<Select options={sortOptions} value={sortCriteria} onchange={handleSortChange} />
			</div>
			<section class="histogram-section">
				{#if rankHistQuery.data}
					<RankHistogram
						data={rankHistQuery.data}
						sortBy={sortCriteria}
						onSortChange={handleSortChange}
						isLoading={rankHistQuery.isLoading}
						height={'300px'}
					/>
				{/if}
			</section>
		</div>

		<LeaderboardTable
			data={rankQuery.data?.data ?? []}
			myRanking={rankQuery.data?.yourRanking}
			isLoading={rankQuery.isLoading}
			onRowClick={handleRowClick}
		/>

		{#if maxPage > 0}
			<section class="pagination-section">
				<Pagination {currentPage} {maxPage} onPageChange={handlePageChange} />
			</section>
		{/if}
	</div>
</div>

<style>

	.leaderboard-page-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px;
		text-align: center;
		margin-bottom: 60px;
		margin-top: 70px;
	}

	.leaderboard-page-title {
		font-family: 'Lexend', sans-serif;
		font-size: 2.25rem;
		font-weight: 700;
		color: #ffffff;
	}

	.leaderboard-page-content {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}


	.histogram-section {
		padding: 5px;
		background-color: #201E3A;
		border-radius: 4px;
	}

	.histogram-section-header {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: 20px;
	}

	.histogram-section-label {
		font-family: 'M PLUS 2', sans-serif;
		font-size: 0.875rem;
		color: #fff;
	}

	.pagination-section {
		display: flex;
		justify-content: center;
		padding: 28px;
	}
</style>
