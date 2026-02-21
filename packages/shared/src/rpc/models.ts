// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';
import { RankType } from '../rank';

export const ApiSimpleUserInfo = z.object({
	userId: z.string(),
	username: z.string(),
});

export type ApiSimpleUserInfoT = z.infer<typeof ApiSimpleUserInfo>;

export const SearchUserParams = z.string();

export type SearchUserParamsT = z.infer<typeof SearchUserParams>;

export const SearchUserResponse = ApiSimpleUserInfo.clone().array();

export type SearchUserResponseT = z.infer<typeof SearchUserResponse>;

export const RankingTop3Base = z.object({
	place: z.number(),
	rank: z.enum(RankType),
	user: ApiSimpleUserInfo,
});

export type RankingTop3BaseT = z.infer<typeof RankingTop3Base>;

export const TodayTopParams = z.void();

export type TodayTopParamsT = z.infer<typeof TodayTopParams>;

export const TodayTopResponse = RankingTop3Base.clone()
	.and(
		z.object({
			time: z.number(),
		}),
	)
	.array();

export type TodayTopResponseT = z.infer<typeof TodayTopResponse>;

export const RankTopParams = z.void();

export type RankTopParamsT = z.infer<typeof RankTopParams>;

export const RankTopResponse = RankingTop3Base.clone()
	.and(
		z.object({
			pt: z.number(),
		}),
	)
	.array();

export type RankTopResponseT = z.infer<typeof RankTopResponse>;
