import { prisma } from '../../db';
import { withCache } from './cache';
import { calculateTimeDifferenceSeconds, isFlying } from './match';

/** 圏内順位の閾値 */
const WITHIN_ZONE_THRESHOLD = 10;

/**
 * ユーザーの統計情報を取得するためのレコードデータ
 */
type RecordWithMatchDate = {
	place: number;
	postedAt: Date;
	matchDate: {
		date: Date;
	};
};

/**
 * ユーザーの統計情報を計算する。
 * @param userId ユーザーID
 * @returns 統計情報（非フライング記録が0件の場合、一部undefinedを含む）
 */
export async function calculateUserStatistics(userId: string): Promise<{
	totalParticipationCount: number;
	averagePlace: number | undefined;
	maxPlace: number | undefined;
	winCount: number;
	withinCount: number;
	averageTime: number | undefined;
	wr: number;
	lateTime: number | undefined;
	earlyTime: number | undefined;
	flyingCount: number;
} | null> {
	const records = await prisma.record.findMany({
		where: { userId },
		select: {
			place: true,
			postedAt: true,
			matchDate: {
				select: { date: true },
			},
		},
	});

	if (records.length === 0) {
		return null;
	}

	return calculateStatisticsFromRecords(records);
}

/**
 * レコード配列から統計情報を計算する。
 * @param records レコード配列
 * @returns 統計情報
 */
export function calculateStatisticsFromRecords(records: RecordWithMatchDate[]): {
	totalParticipationCount: number;
	averagePlace: number | undefined;
	maxPlace: number | undefined;
	winCount: number;
	withinCount: number;
	averageTime: number | undefined;
	wr: number;
	lateTime: number | undefined;
	earlyTime: number | undefined;
	flyingCount: number;
} {
	let flyingCount = 0;
	let winCount = 0;
	let withinCount = 0;
	const nonFlyingPlaces: number[] = [];
	const nonFlyingTimes: number[] = [];

	for (const record of records) {
		const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);

		if (isFlying(timeDiff)) {
			flyingCount++;
		} else {
			nonFlyingPlaces.push(record.place);
			nonFlyingTimes.push(timeDiff);

			if (record.place === 1) {
				winCount++;
			}
			if (record.place <= WITHIN_ZONE_THRESHOLD) {
				withinCount++;
			}
		}
	}

	const totalParticipationCount = records.length;
	const hasNonFlyingRecords = nonFlyingPlaces.length > 0;

	const averagePlace = hasNonFlyingRecords
		? nonFlyingPlaces.reduce((sum, p) => sum + p, 0) / nonFlyingPlaces.length
		: undefined;

	const maxPlace = hasNonFlyingRecords ? Math.max(...nonFlyingPlaces) : undefined;

	const averageTime = hasNonFlyingRecords ? nonFlyingTimes.reduce((sum, t) => sum + t, 0) / nonFlyingTimes.length : undefined;

	const wr = totalParticipationCount > 0 ? winCount / totalParticipationCount : 0;

	const earlyTime = hasNonFlyingRecords ? Math.min(...nonFlyingTimes) : undefined;
	const lateTime = hasNonFlyingRecords ? Math.max(...nonFlyingTimes) : undefined;

	return {
		totalParticipationCount,
		averagePlace,
		maxPlace,
		winCount,
		withinCount,
		averageTime,
		wr,
		lateTime,
		earlyTime,
		flyingCount,
	};
}

/**
 * 全体平均を計算する（レーダーチャート用）。
 * プライバシー設定に関係なく全ユーザーを対象とする。
 * @returns 全体平均
 */
export async function calculateGlobalAverages(): Promise<{
	totalPt: number;
	wr: number;
	averagePlace: number;
	averageTime: number;
	totalParticipationCount: number;
}> {
	const [rankStatuses, records] = await Promise.all([
		prisma.userRankStatus.findMany({
			where: {
				user: {
					banned: false,
				},
			},
			select: {
				id: true,
				pt: true,
			},
		}),
		prisma.record.findMany({
			where: {
				user: {
					banned: false,
				},
			},
			select: {
				userId: true,
				place: true,
				postedAt: true,
				matchDate: {
					select: { date: true },
				},
			},
		}),
	]);

	if (records.length === 0) {
		return {
			totalPt: 0,
			wr: 0,
			averagePlace: 0,
			averageTime: 0,
			totalParticipationCount: 0,
		};
	}

	const totalPtMap = new Map<string, number>();
	for (const status of rankStatuses) {
		totalPtMap.set(status.id, status.pt);
	}

	type GlobalStatsAcc = {
		totalParticipationCount: number;
		winCount: number;
		flyingCount: number;
		sumPlace: number;
		sumTime: number;
	};

	const statsByUser = new Map<string, GlobalStatsAcc>();
	for (const record of records) {
		let stats = statsByUser.get(record.userId);
		if (!stats) {
			stats = {
				totalParticipationCount: 0,
				winCount: 0,
				flyingCount: 0,
				sumPlace: 0,
				sumTime: 0,
			};
			statsByUser.set(record.userId, stats);
		}

		stats.totalParticipationCount += 1;
		const timeDiff = calculateTimeDifferenceSeconds(record.postedAt, record.matchDate.date);
		if (isFlying(timeDiff)) {
			stats.flyingCount += 1;
			continue;
		}

		stats.sumPlace += record.place;
		stats.sumTime += timeDiff;
		if (record.place === 1) {
			stats.winCount += 1;
		}
	}

	let totalPtSum = 0;
	let totalWrSum = 0;
	let totalPlaceSum = 0;
	let totalTimeSum = 0;
	let totalParticipationSum = 0;
	let userCount = 0;
	let placeCount = 0;
	let timeCount = 0;

	for (const [userId, stats] of statsByUser) {
		const totalPt = totalPtMap.get(userId) ?? 0;
		totalPtSum += totalPt;

		const nonFlyingCount = stats.totalParticipationCount - stats.flyingCount;
		const averagePlace = nonFlyingCount > 0 ? stats.sumPlace / nonFlyingCount : undefined;
		const averageTime = nonFlyingCount > 0 ? stats.sumTime / nonFlyingCount : undefined;
		const wr = stats.totalParticipationCount > 0 ? stats.winCount / stats.totalParticipationCount : 0;

		totalWrSum += wr;
		totalParticipationSum += stats.totalParticipationCount;

		if (averagePlace !== undefined) {
			totalPlaceSum += averagePlace;
			placeCount += 1;
		}
		if (averageTime !== undefined) {
			totalTimeSum += averageTime;
			timeCount += 1;
		}
		userCount += 1;
	}

	if (userCount === 0) {
		return {
			totalPt: 0,
			wr: 0,
			averagePlace: 0,
			averageTime: 0,
			totalParticipationCount: 0,
		};
	}

	return {
		totalPt: totalPtSum / userCount,
		wr: totalWrSum / userCount,
		averagePlace: placeCount > 0 ? totalPlaceSum / placeCount : 0,
		averageTime: timeCount > 0 ? totalTimeSum / timeCount : 0,
		totalParticipationCount: totalParticipationSum / userCount,
	};
}

export function getCachedGlobalAverages(): Promise<{
	totalPt: number;
	wr: number;
	averagePlace: number;
	averageTime: number;
	totalParticipationCount: number;
}> {
	return withCache('globalAverages', null, calculateGlobalAverages);
}
