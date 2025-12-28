import { z } from 'zod';
import { RankType } from '../rank';

export const ApiSimpleUserInfo = z.object({
	userId: z.string(),
	username: z.string(),
});

export const SearchUserParams = z.string();

export const SearchUserResponse = ApiSimpleUserInfo.clone().array();

export const RankingTop3Base = z.object({
	place: z.number(),
	rank: z.enum(RankType),
	user: ApiSimpleUserInfo,
});

export const TodayTopParams = z.void();

export const TodayTopResponse = RankingTop3Base.clone()
	.and(
		z.object({
			time: z.number(),
		}),
	)
	.array();

export const RankTopParams = z.void();

export const RankTopResponse = RankingTop3Base.clone()
	.and(
		z.object({
			pt: z.number(),
		}),
	)
	.array();
