import { RankType } from '@midnight-network/shared/rank';
import type {
	EarnedPtParamsT,
	EarnedPtResponseT,
	HeatmapParamsT,
	HeatmapResponseT,
	PostTimeParamsT,
	PostTimeResponseT,
	RadarParamsT,
	RadarResponseT,
	TotalPtParamsT,
	TotalPtResponseT,
	UserParamsT,
	UserResponseT,
} from '@midnight-network/shared/rpc/user/models';
import { GraphSpan, HeatmapType } from '@midnight-network/shared/rpc/user/models';
import { prisma } from '../../db';
import { withCache } from '../helpers/cache';
import { calculateTimeDifferenceSeconds, isFlying } from '../helpers/match';
import { canViewProfileStats } from '../helpers/privacy';
import {
	calculatePointsToNextRank,
	calculateRankFromPoints,
	calculateRemainingParticipationCount,
	rankNumberToRankTypeValue,
} from '../helpers/rank';
import { calculateGlobalAverages, calculateUserStatistics } from '../helpers/statistics';

/** Daily期間の最大日数 */
const DAILY_MAX_DAYS = 30;
/** Weekly期間の最大週数 */
const WEEKLY_MAX_WEEKS = 26;
/** Monthly期間の最大月数 */
const MONTHLY_MAX_MONTHS = 12;
/** ヒートマップの最大日数 */
const HEATMAP_MAX_DAYS = 30;

/**
 * ユーザープロフィール情報を取得する。
 * showProfileStatsがfalseのユーザーはundefinedを返す。
 * @param userId ユーザーID
 * @returns ユーザープロフィール情報
 */
export async function profile(userId: UserParamsT): Promise<UserResponseT> {
	console.info('rpc.user.profile', userId);
	return await withCache('profile', userId, async () => {
		const user = await prisma.user.findUnique({
			where: { id: userId, banned: false },
			select: {
				id: true,
				userRankStatuses: {
					select: {
						pt: true,
						streakParticipationAt: true,
						streakAbsenceAt: true,
						streakWithinTopAt: true,
						streakFlyingAt: true,
						protectCoolTime: true,
					},
				},
				userSettings: {
					select: { showProfileStats: true },
				},
				records: {
					select: {
						place: true,
						postedAt: true,
						matchDate: {
							select: { date: true },
						},
					},
				},
			},
		});

		if (!user) {
			console.info('rpc.user.profile.notFound', userId);
			return undefined;
		}

		if (user.userSettings?.showProfileStats === false) {
			console.info('rpc.user.profile.hiddenBySettings', userId);
			return undefined;
		}

		const totalPt = user.userRankStatuses?.pt ?? 0;
		const participationCount = user.records.length;
		const { rankNumber, isNoRank } = calculateRankFromPoints(totalPt, participationCount);
		const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

		const stats = await calculateUserStatistics(userId);
		console.info('rpc.user.profile.stats', { userId, hasStats: Boolean(stats) });

		const currentRank = isNoRank
			? {
					rank: RankType.NoRank,
					remainingParticipationCount: calculateRemainingParticipationCount(participationCount),
				}
			: {
					rank: rankValue as Exclude<typeof rankValue, typeof RankType.NoRank>,
					nextRankPt: calculatePointsToNextRank(totalPt, rankNumber),
				};

		const rankStatus = {
			totalPt,
			streakParticipationAt: user.userRankStatuses?.streakParticipationAt ?? 0,
			streakAbsenceAt: user.userRankStatuses?.streakAbsenceAt ?? 0,
			streakWithinTopAt: user.userRankStatuses?.streakWithinTopAt ?? 0,
			streakFlyingAt: user.userRankStatuses?.streakFlyingAt ?? 0,
			protectCoolTime: user.userRankStatuses?.protectCoolTime ?? 0,
		};

		const statistics = stats
			? {
					totalParticipationCount: stats.totalParticipationCount,
					averagePlace: stats.averagePlace ?? 0,
					maxPlace: stats.maxPlace ?? 0,
					winCount: stats.winCount,
					withinCount: stats.withinCount,
					averageTime: stats.averageTime ?? 0,
					wr: stats.wr,
					lateTime: stats.lateTime ?? 0,
					earlyTime: stats.earlyTime ?? 0,
					flyingCount: stats.flyingCount,
				}
			: undefined;

		return {
			currentRank,
			rankStatus,
			statistics,
		};
	});
}

/**
 * 獲得ptチャートを取得する。
 * Daily: 最長1ヶ月、Weekly: 最長半年、Monthly: 最長1年
 * @param params パラメータ（userId, span）
 * @returns 獲得ptチャートデータ
 */
export async function earnedPtChart(params: EarnedPtParamsT): Promise<EarnedPtResponseT> {
	console.info('rpc.user.earnedPtChart', { userId: params.userId, span: params.span });
	return await withCache('earnedPtChart', params, async () => {
		console.info('earnedPtChart.fetchFn.start');

		console.info('earnedPtChart.canViewProfileStats.before');
		const canView = await canViewProfileStats(params.userId);
		console.info('earnedPtChart.canViewProfileStats.after', { canView });
		if (!canView) {
			console.info('rpc.user.earnedPtChart.noPermission', params.userId);
			return [];
		}

		const maxDays = getMaxDaysForSpan(params.span);
		const startDate = new Date();
		startDate.setUTCDate(startDate.getUTCDate() - maxDays);

		console.info('earnedPtChart.prisma.before');
		const histories = await prisma.userRankHistory.findMany({
			where: {
				userId: params.userId,
				matchDate: {
					date: { gte: startDate },
				},
			},
			select: {
				earnedPt: true,
				pt: true,
				matchDate: {
					select: { date: true },
				},
			},
			orderBy: {
				matchDate: { date: 'asc' },
			},
		});
		console.info('earnedPtChart.prisma.after', { count: histories.length });

		console.info('earnedPtChart.aggregateChartData.before');
		const result = aggregateChartData(
			histories.map((h) => ({
				date: h.matchDate.date,
				value: h.earnedPt,
				totalPt: h.pt,
			})),
			params.span,
			maxDays,
		);
		console.info('earnedPtChart.aggregateChartData.after', { count: result.length });
		return result;
	});
}

/**
 * ヒートマップチャートを取得する（最長30日）。
 * @param userId ユーザーID
 * @returns ヒートマップデータ
 */
export async function heatmapChart(userId: HeatmapParamsT): Promise<HeatmapResponseT> {
	console.info('rpc.user.heatmapChart', userId);
	return await withCache('heatmapChart', userId, async () => {
		const canView = await canViewProfileStats(userId);
		if (!canView) {
			console.info('rpc.user.heatmapChart.noPermission', userId);
			return [];
		}

		const startDate = new Date();
		startDate.setUTCDate(startDate.getUTCDate() - HEATMAP_MAX_DAYS);

		const matchDates = await prisma.matchDate.findMany({
			where: {
				date: { gte: startDate },
			},
			select: {
				id: true,
				date: true,
				records: {
					where: { userId },
					select: {
						place: true,
						postedAt: true,
					},
				},
			},
			orderBy: { date: 'asc' },
		});
		console.info('rpc.user.heatmapChart.matchDates', matchDates.length);

		const result = matchDates.map((matchDate) => {
			const record = matchDate.records[0];
			if (!record) {
				return { type: HeatmapType.NoParticipation };
			}

			const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, matchDate.date);
			if (isFlying(timeDiff)) {
				return { type: HeatmapType.Flying };
			}

			return {
				type: HeatmapType.Participation,
				place: record.place,
			};
		});
		console.info('rpc.user.heatmapChart.result', result.length);
		return result;
	});
}

/**
 * 投稿時間チャートを取得する。
 * Weekly/Monthlyは平均化。フライングは除外して平均化。
 * @param params パラメータ（userId, span）
 * @returns 投稿時間チャートデータ
 */
export async function postTimeChart(params: PostTimeParamsT): Promise<PostTimeResponseT> {
	console.info('rpc.user.postTimeChart', { userId: params.userId, span: params.span });
	return await withCache('postTimeChart', params, async () => {
		console.info('postTimeChart.fetchFn.start');

		console.info('postTimeChart.canViewProfileStats.before');
		const canView = await canViewProfileStats(params.userId);
		console.info('postTimeChart.canViewProfileStats.after', { canView });
		if (!canView) {
			console.info('rpc.user.postTimeChart.noPermission', params.userId);
			return [];
		}

		const maxDays = getMaxDaysForSpan(params.span);
		const startDate = new Date();
		startDate.setUTCDate(startDate.getUTCDate() - maxDays);

		console.info('postTimeChart.prisma.before');
		const records = await prisma.record.findMany({
			where: {
				userId: params.userId,
				matchDate: {
					date: { gte: startDate },
				},
			},
			select: {
				place: true,
				postedAt: true,
				matchDate: {
					select: { date: true },
				},
			},
			orderBy: {
				matchDate: { date: 'asc' },
			},
		});
		console.info('postTimeChart.prisma.after', { count: records.length });

		if (params.span === GraphSpan.Daily) {
			console.info('postTimeChart.daily.map.before');
			const result = records.map((r) => {
				const timeDiff = calculateTimeDifferenceSeconds(r.postedAt, r.matchDate.date);
				const flying = isFlying(timeDiff);

				if (flying) {
					return {
						value: timeDiff,
						label: formatDateLabel(r.matchDate.date, GraphSpan.Daily),
						postedAt: r.postedAt,
						isFlying: true as const,
					};
				}

				return {
					value: timeDiff,
					label: formatDateLabel(r.matchDate.date, GraphSpan.Daily),
					postedAt: r.postedAt,
					isFlying: false as const,
					place: r.place,
				};
			});
			console.info('postTimeChart.daily.map.after', { count: result.length });
			return result;
		}

		console.info('postTimeChart.createDateBuckets.before');
		const buckets = createDateBuckets(startDate, new Date(), params.span);
		console.info('postTimeChart.createDateBuckets.after', { count: buckets.length });

		console.info('postTimeChart.buildPostTimeBuckets.before');
		const result = buckets.map((bucket) => {
			const bucketRecords = records.filter((r) => {
				const recordDate = r.matchDate.date;
				return recordDate >= bucket.start && recordDate < bucket.end;
			});

			const nonFlyingRecords = bucketRecords.filter((r) => {
				const timeDiff = calculateTimeDifferenceSeconds(r.postedAt, r.matchDate.date);
				return !isFlying(timeDiff);
			});

			if (nonFlyingRecords.length === 0) {
				return {
					value: 0,
					label: bucket.label,
					postedAt: bucket.start,
					isFlying: false as const,
					place: 0,
				};
			}

			const firstRecord = nonFlyingRecords[0];
			if (!firstRecord) {
				return {
					value: 0,
					label: bucket.label,
					postedAt: bucket.start,
					isFlying: false as const,
					place: 0,
				};
			}

			const avgTime =
				nonFlyingRecords.reduce((sum, r) => {
					return sum + calculateTimeDifferenceSeconds(r.postedAt, r.matchDate.date);
				}, 0) / nonFlyingRecords.length;

			const avgPlace = nonFlyingRecords.reduce((sum, r) => sum + r.place, 0) / nonFlyingRecords.length;

			return {
				value: avgTime,
				label: bucket.label,
				postedAt: firstRecord.postedAt,
				isFlying: false as const,
				place: Math.round(avgPlace),
			};
		});
		console.info('postTimeChart.buildPostTimeBuckets.after', { count: result.length });
		return result;
	});
}

/**
 * レーダーチャートデータを取得する。
 * 全体平均を50%として比較値を返す。
 * @param userId ユーザーID
 * @returns レーダーチャートデータ
 */
export async function radarChart(userId: RadarParamsT): Promise<RadarResponseT> {
	console.info('rpc.user.radarChart', userId);
	return await withCache('radarChart', userId, async () => {
		const canView = await canViewProfileStats(userId);
		if (!canView) {
			console.info('rpc.user.radarChart.noPermission', userId);
			return {
				totalPt: 0,
				wr: 0,
				averagePlace: 0,
				averageTime: 0,
				totalParticipationCount: 0,
			};
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				userRankStatuses: {
					select: { pt: true },
				},
				records: {
					select: {
						place: true,
						postedAt: true,
						matchDate: {
							select: { date: true },
						},
					},
				},
			},
		});

		if (!user || user.records.length === 0) {
			console.info('rpc.user.radarChart.noRecords', userId);
			return {
				totalPt: 0,
				wr: 0,
				averagePlace: 0,
				averageTime: 0,
				totalParticipationCount: 0,
			};
		}

		const userStats = await calculateUserStatistics(userId);
		const globalAvg = await calculateGlobalAverages();
		const totalPt = user.userRankStatuses?.pt ?? 0;
		console.info('rpc.user.radarChart.stats', { userId, hasStats: Boolean(userStats) });

		const calculateRatio = (userValue: number, globalValue: number, inverse: boolean): number => {
			if (globalValue === 0) {
				return 50;
			}
			if (inverse) {
				return (globalValue / userValue) * 50;
			}
			return (userValue / globalValue) * 50;
		};

		return {
			totalPt: calculateRatio(totalPt, globalAvg.totalPt, false),
			wr: calculateRatio(userStats?.wr ?? 0, globalAvg.wr, false),
			averagePlace: calculateRatio(userStats?.averagePlace ?? 0, globalAvg.averagePlace, true),
			averageTime: calculateRatio(userStats?.averageTime ?? 0, globalAvg.averageTime, true),
			totalParticipationCount: calculateRatio(
				userStats?.totalParticipationCount ?? 0,
				globalAvg.totalParticipationCount,
				false,
			),
		};
	});
}

/**
 * 累計ptチャートを取得する。
 * Daily: 最長1ヶ月、Weekly: 最長半年、Monthly: 最長1年
 * @param params パラメータ（userId, span）
 * @returns 累計ptチャートデータ
 */
export async function totalPtChart(params: TotalPtParamsT): Promise<TotalPtResponseT> {
	console.info('rpc.user.totalPtChart', { userId: params.userId, span: params.span });
	return await withCache('totalPtChart', params, async () => {
		const canView = await canViewProfileStats(params.userId);
		if (!canView) {
			console.info('rpc.user.totalPtChart.noPermission', params.userId);
			return [];
		}

		const maxDays = getMaxDaysForSpan(params.span);
		const startDate = new Date();
		startDate.setUTCDate(startDate.getUTCDate() - maxDays);

		const histories = await prisma.userRankHistory.findMany({
			where: {
				userId: params.userId,
				matchDate: {
					date: { gte: startDate },
				},
			},
			select: {
				pt: true,
				matchDate: {
					select: { date: true },
				},
			},
			orderBy: {
				matchDate: { date: 'asc' },
			},
		});
		console.info('rpc.user.totalPtChart.histories', histories.length);

		const user = await prisma.user.findUnique({
			where: { id: params.userId },
			select: {
				records: {
					select: { id: true },
				},
			},
		});
		console.info('rpc.user.totalPtChart.userFound', Boolean(user));

		const participationCount = user?.records.length ?? 0;

		if (params.span === GraphSpan.Daily) {
			const result = histories.map((h) => {
				const { rankNumber, isNoRank } = calculateRankFromPoints(h.pt, participationCount);
				const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

				return {
					value: h.pt,
					label: formatDateLabel(h.matchDate.date, GraphSpan.Daily),
					rank: rankValue,
				};
			});
			console.info('rpc.user.totalPtChart.result', result.length);
			return result;
		}

		const buckets = createDateBuckets(startDate, new Date(), params.span);

		const result = buckets.map((bucket) => {
			const bucketHistories = histories.filter((h) => {
				const historyDate = h.matchDate.date;
				return historyDate >= bucket.start && historyDate < bucket.end;
			});

			if (bucketHistories.length === 0) {
				return {
					value: 0,
					label: bucket.label,
					rank: RankType.NoRank,
				};
			}

			const avgPt = bucketHistories.reduce((sum, h) => sum + h.pt, 0) / bucketHistories.length;

			const { rankNumber, isNoRank } = calculateRankFromPoints(avgPt, participationCount);
			const rankValue = rankNumberToRankTypeValue(rankNumber, isNoRank);

			return {
				value: Math.round(avgPt),
				label: bucket.label,
				rank: rankValue,
			};
		});
		console.info('rpc.user.totalPtChart.result', result.length);
		return result;
	});
}

/**
 * スパンに応じた最大日数を取得する。
 * @param span グラフスパン
 * @returns 最大日数
 */
function getMaxDaysForSpan(span: number): number {
	switch (span) {
		case GraphSpan.Daily:
			return DAILY_MAX_DAYS;
		case GraphSpan.Weakly:
			return WEEKLY_MAX_WEEKS * 7;
		case GraphSpan.Monthly:
			return MONTHLY_MAX_MONTHS * 30;
		default:
			return DAILY_MAX_DAYS;
	}
}

/**
 * 日付ラベルをフォーマットする。
 * @param date 日付
 * @param span グラフスパン
 * @returns フォーマットされたラベル
 */
function formatDateLabel(date: Date, span: number): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');

	switch (span) {
		case GraphSpan.Daily:
			return `${year}-${month}-${day}`;
		case GraphSpan.Weakly:
			return `${year}-${month}-${day}`;
		case GraphSpan.Monthly:
			return `${year}-${month}`;
		default:
			return `${year}-${month}-${day}`;
	}
}

/**
 * 日付バケットを作成する。
 * @param startDate 開始日
 * @param endDate 終了日
 * @param span グラフスパン
 * @returns バケット配列
 */
function createDateBuckets(startDate: Date, endDate: Date, span: number): Array<{ start: Date; end: Date; label: string }> {
	const buckets: Array<{ start: Date; end: Date; label: string }> = [];

	if (span === GraphSpan.Weakly) {
		const current = new Date(startDate);
		current.setUTCHours(0, 0, 0, 0);
		const dayOfWeek = current.getUTCDay();
		current.setUTCDate(current.getUTCDate() - dayOfWeek);

		while (current < endDate) {
			const weekStart = new Date(current);
			const weekEnd = new Date(current);
			weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

			buckets.push({
				start: weekStart,
				end: weekEnd,
				label: formatDateLabel(weekStart, GraphSpan.Weakly),
			});

			current.setUTCDate(current.getUTCDate() + 7);
		}
	} else if (span === GraphSpan.Monthly) {
		const current = new Date(startDate);
		current.setUTCDate(1);
		current.setUTCHours(0, 0, 0, 0);

		while (current < endDate) {
			const monthStart = new Date(current);
			const monthEnd = new Date(current);
			monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

			buckets.push({
				start: monthStart,
				end: monthEnd,
				label: formatDateLabel(monthStart, GraphSpan.Monthly),
			});

			current.setUTCMonth(current.getUTCMonth() + 1);
		}
	}

	return buckets;
}

/**
 * チャートデータを集約する（earnedPtChart用）。
 * @param data 生データ
 * @param span グラフスパン
 * @param maxDays 最大日数
 * @returns 集約されたチャートデータ
 */
function aggregateChartData(
	data: Array<{ date: Date; value: number; totalPt: number }>,
	span: number,
	maxDays: number,
): EarnedPtResponseT {
	if (span === GraphSpan.Daily) {
		return data.map((d) => ({
			value: d.value,
			label: formatDateLabel(d.date, GraphSpan.Daily),
			totalPt: d.totalPt,
		}));
	}

	const startDate = new Date();
	startDate.setUTCDate(startDate.getUTCDate() - maxDays);
	const buckets = createDateBuckets(startDate, new Date(), span);

	return buckets.map((bucket) => {
		const bucketData = data.filter((d) => {
			return d.date >= bucket.start && d.date < bucket.end;
		});

		if (bucketData.length === 0) {
			return {
				value: 0,
				label: bucket.label,
				totalPt: 0,
			};
		}

		const avgValue = bucketData.reduce((sum, d) => sum + d.value, 0) / bucketData.length;
		const avgTotalPt = bucketData.reduce((sum, d) => sum + d.totalPt, 0) / bucketData.length;

		return {
			value: Math.round(avgValue),
			label: bucket.label,
			totalPt: Math.round(avgTotalPt),
		};
	});
}
