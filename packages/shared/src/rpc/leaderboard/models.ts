import { z } from 'zod';
import { RankType } from '../../rank';
import { ApiSimpleUserInfo } from '../models';

export const RankHistParams = z.void();

export type RankHistParamsT = z.infer<typeof RankHistParams>;

export const RankHistResponse = z
	.object({
		rank: z.enum(RankType),
		percent: z.number(),
	})
	.array();

export type RankHistResponseT = z.infer<typeof RankHistResponse>;

export const RankParams = z.void();

export type RankParamsT = z.infer<typeof RankParams>;

export const BasicTableResponseData = z.object({
	place: z.number(),
	user: ApiSimpleUserInfo,
	wr: z.number(),
	averageTime: z.number(),
	totalPt: z.number(),
	rank: z.enum(RankType),
});

export type BasicTableResponseDataT = z.infer<typeof BasicTableResponseData>;

export const PreviouslyTableResponseData = BasicTableResponseData.clone().and(
	z.object({
		previousPlace: z.number(),
	}),
);

export type PreviouslyTableResponseDataT = z.infer<typeof PreviouslyTableResponseData>;

export const RankResponse = PreviouslyTableResponseData.clone().array();

export type RankResponseT = z.infer<typeof RankResponse>;

export const WrParams = z.void();

export type WrParamsT = z.infer<typeof WrParams>;

export const WrResponse = PreviouslyTableResponseData.clone().array();

export type WrResponseT = z.infer<typeof WrResponse>;

export const MatchTimeParams = z.void();

export type MatchTimeParamsT = z.infer<typeof MatchTimeParams>;

export const MatchTimeResponse = BasicTableResponseData.clone().array();

export type MatchTimeResponseT = z.infer<typeof MatchTimeResponse>;

export const AvgTimeParams = z.void();

export type AvgTimeParamsT = z.infer<typeof AvgTimeParams>;

export const AvgTimeResponse = PreviouslyTableResponseData.clone().array();

export type AvgTimeResponseT = z.infer<typeof AvgTimeResponse>;
