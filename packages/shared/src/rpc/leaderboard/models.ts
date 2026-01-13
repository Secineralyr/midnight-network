import { z } from 'zod';
import { RankType } from '../../rank';
import { ApiSimpleUserInfo } from '../models';

export const RankHistParams = z.number();

export type RankHistParamsT = z.infer<typeof RankHistParams>;

export const RankHistResponse = z
	.object({
		rank: z.enum(RankType),
		percent: z.number(),
	})
	.array();

export type RankHistResponseT = z.infer<typeof RankHistResponse>;

export const RankParams = z.number();

export type RankParamsT = z.infer<typeof RankParams>;

export const BasicTableResponseData = z.object({
	place: z.number(),
	previousPlace: z.number().optional(),
	user: ApiSimpleUserInfo,
	wr: z.number(),
	averageTime: z.number(),
	totalPt: z.number(),
	rank: z.enum(RankType),
});

export type BasicTableResponseDataT = z.infer<typeof BasicTableResponseData>;

export const RankResponse = z.object({
	currentOffset: z.number(),
	maxOffset: z.number(),
	yourRanking: z.optional(BasicTableResponseData),
	data: BasicTableResponseData.clone().array(),
});

export type RankResponseT = z.infer<typeof RankResponse>;

export const WrParams = z.number();

export type WrParamsT = z.infer<typeof WrParams>;

export const WrResponse = z.object({
	currentOffset: z.number(),
	maxOffset: z.number(),
	yourRanking: z.optional(BasicTableResponseData),
	data: BasicTableResponseData.clone().array(),
});

export type WrResponseT = z.infer<typeof WrResponse>;

export const MatchTimeParams = z.number();

export type MatchTimeParamsT = z.infer<typeof MatchTimeParams>;

export const MatchTimeResponse = z.object({
	currentOffset: z.number(),
	maxOffset: z.number(),
	yourRanking: z.optional(BasicTableResponseData),
	data: BasicTableResponseData.clone().array(),
});

export type MatchTimeResponseT = z.infer<typeof MatchTimeResponse>;

export const AvgTimeParams = z.number();

export type AvgTimeParamsT = z.infer<typeof AvgTimeParams>;

export const AvgTimeResponse = z.object({
	currentOffset: z.number(),
	maxOffset: z.number(),
	yourRanking: z.optional(BasicTableResponseData),
	data: BasicTableResponseData.clone().array(),
});

export type AvgTimeResponseT = z.infer<typeof AvgTimeResponse>;
