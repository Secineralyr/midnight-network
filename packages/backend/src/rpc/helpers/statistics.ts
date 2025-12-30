import { prisma } from '../../db';
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
	const allUsers = await prisma.user.findMany({
		where: {
			banned: false,
		},
		select: {
			id: true,
			userRankStatuses: {
				select: {
					pt: true,
				},
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

	let totalPtSum = 0;
	let totalWrSum = 0;
	let totalPlaceSum = 0;
	let totalTimeSum = 0;
	let totalParticipationSum = 0;
	let userCount = 0;
	let placeCount = 0;
	let timeCount = 0;

	for (const user of allUsers) {
		if (user.records.length === 0) {
			continue;
		}

		const stats = calculateStatisticsFromRecords(user.records);
		totalPtSum += user.userRankStatuses?.pt ?? 0;
		totalWrSum += stats.wr;
		totalParticipationSum += stats.totalParticipationCount;

		if (stats.averagePlace !== undefined) {
			totalPlaceSum += stats.averagePlace;
			placeCount++;
		}
		if (stats.averageTime !== undefined) {
			totalTimeSum += stats.averageTime;
			timeCount++;
		}
		userCount++;
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
