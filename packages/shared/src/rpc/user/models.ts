import { z } from 'zod';
import { RankType } from '../../rank';

export const UserParams = z.string();

export const CurrentRank = z
	.object({
		rank: z.enum(RankType).extract(['NoRank']),
		remainingParticipationCount: z.number(),
	})
	.or(
		z.object({
			rank: z.enum(RankType).exclude(['NoRank']),
			nextRankPt: z.number(),
		}),
	);

export const RankStatus = z.object({
	totalPt: z.number(),
	streakParticipationAt: z.number(),
	streakAbsenceAt: z.number(),
	streakWithinTopAt: z.number(),
	streakFlyingAt: z.number(),
	protectCoolTime: z.number(),
});

export const Statistics = z.object({
	totalParticipationCount: z.number(),
	averagePlace: z.number(),
	maxPlace: z.number(),
	winCount: z.number(),
	withinCount: z.number(),
	averageTime: z.number(),
	wr: z.number(),
	lateTime: z.number(),
	earlyTime: z.number(),
	flyingCount: z.number(),
});

export const UserResponse = z.optional(
	z.object({
		currentRank: CurrentRank,
		rankStatus: RankStatus,
		statistics: z.optional(Statistics),
	}),
);

export const GraphSpan = {
	Daily: 0,
	Weakly: 1,
	Monthly: 2,
} as const;

export const GraphParamBase = z.object({
	span: z.enum(GraphSpan),
});

export const TotalPtParams = GraphParamBase;

export const LineBarChartData = z.object({
	value: z.number(),
	label: z.string(),
});

export const TotalPtResponse = LineBarChartData.clone()
	.and(
		z.object({
			rank: z.enum(RankType),
		}),
	)
	.array();

export const EarnedPtParams = GraphParamBase;

export const EarnedPtResponse = LineBarChartData.clone()
	.and(
		z.object({
			totalPt: z.number(),
		}),
	)
	.array();

export const PostTimeParams = GraphParamBase;

export const PostTimeResponse = LineBarChartData.clone()
	.and(
		z.object({
			postedAt: z.date(),
		}),
	)
	.and(
		z
			.object({
				isFlying: z.literal(false),
				place: z.number(),
			})
			.or(
				z.object({
					isFlying: z.literal(true),
				}),
			),
	)
	.array();

export const RadarParams = z.void();

export const RadarResponse = z.object({
	totalPt: z.number(),
	wr: z.number(),
	averagePlace: z.number(),
	averageTime: z.number(),
	totalParticipationCount: z.number(),
});

export const HeatmapParams = z.void();

export const HeatmapType = {
	NoParticipation: -1,
	Flying: 0,
	Participation: 1,
} as const;

export const HeatmapResponse = z
	.object({
		type: z.enum(HeatmapType).exclude(['Participation']),
	})
	.or(
		z.object({
			type: z.enum(HeatmapType).extract(['Participation']),
			place: z.number(),
		}),
	)
	.array();
