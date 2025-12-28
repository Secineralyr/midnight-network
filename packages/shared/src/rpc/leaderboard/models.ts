import { z } from 'zod';
import { RankType } from '../../rank';
import { ApiSimpleUserInfo } from '../models';

export const RankHistParams = z.void();

export const RankHistResponse = z
	.object({
		rank: z.enum(RankType),
		percent: z.number(),
	})
	.array();

export const RankParams = z.void();

export const BasicTableResponseData = z.object({
	place: z.number(),
	user: ApiSimpleUserInfo,
	wr: z.number(),
	averageTime: z.number(),
	totalPt: z.number(),
	rank: z.enum(RankType),
});

export const PreviouslyTableResponseData = BasicTableResponseData.clone().and(
	z.object({
		previousPlace: z.number(),
	}),
);

export const RankResponse = PreviouslyTableResponseData.clone().array();

export const WrParams = z.void();

export const WrResponse = PreviouslyTableResponseData.clone().array();

export const MatchTimeParams = z.void();

export const MatchTimeResponse = BasicTableResponseData.clone().array();

export const AvgTimeParams = z.void();

export const AvgTimeResponse = PreviouslyTableResponseData.clone().array();
