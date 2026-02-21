// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ContractRouterClient } from '@orpc/contract';
import { oc } from '@orpc/contract';
import {
	AvgTimeParams,
	AvgTimeResponse,
	MatchTimeParams,
	MatchTimeResponse,
	RankHistParams,
	RankHistResponse,
	RankParams,
	RankResponse,
	WrParams,
	WrResponse,
} from './rpc/leaderboard/models';
import {
	GetPushStatusParams,
	GetPushStatusResponse,
	GetSettingsParams,
	GetSettingsResponse,
	LastResultParams,
	LastResultResponse,
	SetSettingsParams,
	SetSettingsResponse,
	SubscribePushParams,
	SubscribePushResponse,
	UnsubscribePushParams,
	UnsubscribePushResponse,
	UserInfoParams,
	UserInfoResponse,
} from './rpc/me/models';
import {
	RankTopParams,
	RankTopResponse,
	SearchUserParams,
	SearchUserResponse,
	TodayTopParams,
	TodayTopResponse,
} from './rpc/models';
import {
	EarnedPtParams,
	EarnedPtResponse,
	HeatmapParams,
	HeatmapResponse,
	PostTimeParams,
	PostTimeResponse,
	RadarParams,
	RadarResponse,
	TotalPtParams,
	TotalPtResponse,
	UserParams,
	UserResponse,
} from './rpc/user/models';

export const meContract = {
	lastResult: oc.input(LastResultParams).output(LastResultResponse),
	getSettings: oc.input(GetSettingsParams).output(GetSettingsResponse),
	setSettings: oc.input(SetSettingsParams).output(SetSettingsResponse),
	userInfo: oc.input(UserInfoParams).output(UserInfoResponse),
	subscribePush: oc.input(SubscribePushParams).output(SubscribePushResponse),
	unsubscribePush: oc.input(UnsubscribePushParams).output(UnsubscribePushResponse),
	getPushStatus: oc.input(GetPushStatusParams).output(GetPushStatusResponse),
} as const;

export const userContract = {
	profile: oc.input(UserParams).output(UserResponse),
	totalPtChart: oc.input(TotalPtParams).output(TotalPtResponse),
	earnedPtChart: oc.input(EarnedPtParams).output(EarnedPtResponse),
	postTimeChart: oc.input(PostTimeParams).output(PostTimeResponse),
	radarChart: oc.input(RadarParams).output(RadarResponse),
	heatmapChart: oc.input(HeatmapParams).output(HeatmapResponse),
} as const;

export const leaderboardContract = {
	rankHistogram: oc.input(RankHistParams).output(RankHistResponse),
	rank: oc.input(RankParams).output(RankResponse),
	wr: oc.input(WrParams).output(WrResponse),
	matchTime: oc.input(MatchTimeParams).output(MatchTimeResponse),
	averageTime: oc.input(AvgTimeParams).output(AvgTimeResponse),
} as const;

export const contract = {
	searchUser: oc.input(SearchUserParams).output(SearchUserResponse),
	todayTop: oc.input(TodayTopParams).output(TodayTopResponse),
	rankTop: oc.input(RankTopParams).output(RankTopResponse),
	me: meContract,
	leaderboard: leaderboardContract,
	user: userContract,
} as const;

export type AppContract = typeof contract;
export type AppClient = ContractRouterClient<AppContract>;
