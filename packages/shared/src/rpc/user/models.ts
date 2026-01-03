import { z } from 'zod';
import { RankType } from '../../rank';

export const UserParams = z.string();

export type UserParamsT = z.infer<typeof UserParams>;

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

export type CurrentRankT = z.infer<typeof CurrentRank>;

export const RankStatus = z.object({
	totalPt: z.number(),
	streakParticipationAt: z.number(),
	streakAbsenceAt: z.number(),
	streakWithinTopAt: z.number(),
	streakFlyingAt: z.number(),
	protectCoolTime: z.number(),
});

export type RankStatusT = z.infer<typeof RankStatus>;

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

export type StatisticsT = z.infer<typeof Statistics>;

export const UserResponse = z.optional(
	z.object({
		currentRank: CurrentRank,
		rankStatus: RankStatus,
		statistics: z.optional(Statistics),
	}),
);

export type UserResponseT = z.infer<typeof UserResponse>;

export const GraphSpan = {
	Daily: 0,
	Weakly: 1,
	Monthly: 2,
} as const;

export const GraphParamBase = z.object({
	userId: z.string(),
	span: z.enum(GraphSpan),
});

export type GraphParamBaseT = z.infer<typeof GraphParamBase>;

export const TotalPtParams = GraphParamBase;

export type TotalPtParamsT = z.infer<typeof TotalPtParams>;

export const LineBarChartData = z.object({
	value: z.number(),
	label: z.string(),
});

export type LineBarChartDataT = z.infer<typeof LineBarChartData>;

export const TotalPtResponse = LineBarChartData.clone()
	.and(
		z.object({
			rank: z.enum(RankType),
		}),
	)
	.array();

export type TotalPtResponseT = z.infer<typeof TotalPtResponse>;

export const EarnedPtParams = GraphParamBase;

export type EarnedPtParamsT = z.infer<typeof EarnedPtParams>;

export const EarnedPtResponse = LineBarChartData.clone()
	.and(
		z.object({
			totalPt: z.number(),
		}),
	)
	.array();

export type EarnedPtResponseT = z.infer<typeof EarnedPtResponse>;

export const PostTimeParams = GraphParamBase;

export type PostTimeParamsT = z.infer<typeof PostTimeParams>;

export const PostTimeResponse = LineBarChartData.clone()
	.and(
		z.object({
			postedAt: z.coerce.date(),
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

export type PostTimeResponseT = z.infer<typeof PostTimeResponse>;

export const RadarParams = z.string();

export type RadarParamsT = z.infer<typeof RadarParams>;

export const RadarResponse = z.object({
	totalPt: z.number(),
	wr: z.number(),
	averagePlace: z.number(),
	averageTime: z.number(),
	totalParticipationCount: z.number(),
});

export type RadarResponseT = z.infer<typeof RadarResponse>;

export const HeatmapParams = z.string();

export type HeatmapParamsT = z.infer<typeof HeatmapParams>;

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

export type HeatmapResponseT = z.infer<typeof HeatmapResponse>;
