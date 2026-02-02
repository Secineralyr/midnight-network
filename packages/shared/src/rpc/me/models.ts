import { z } from 'zod';
import { RankType } from '../../rank';

export const SettingType = z.object({
	showLeaderboardRank: z.boolean(),
	showLeaderboardRanking: z.boolean(),
	showProfileStats: z.boolean(),
	showProfileSearch: z.boolean(),
});

export type SettingTypeT = z.infer<typeof SettingType>;

export const GetSettingsParams = z.void();

export type GetSettingsParamsT = z.infer<typeof GetSettingsParams>;

export const GetSettingsResponse = SettingType;

export type GetSettingsResponseT = z.infer<typeof GetSettingsResponse>;

export const SetSettingsParams = SettingType.clone().partial();

export type SetSettingsParamsT = z.infer<typeof SetSettingsParams>;

export const SetSettingsResponse = z.void();

export type SetSettingsResponseT = z.infer<typeof SetSettingsResponse>;

export const LastResultParams = z.void();

export type LastResultParamsT = z.infer<typeof LastResultParams>;

export const RankShiftType = {
	RankUp: 1,
	None: 0,
	RankDown: -1,
} as const;

export const LastResultResponse = z.optional(
	z.object({
		targetDate: z.coerce.date(),
		place: z.number(),
		time: z.number(),
		earnedPt: z.number(),
		latestTotalPt: z.number(),
		latestRank: z.enum(RankType),
		rankShift: z.enum(RankShiftType),
	}),
);

export type LastResultResponseT = z.infer<typeof LastResultResponse>;

// Push Subscription
export const SubscribePushParams = z.object({
	endpoint: z.string().url(),
	p256dh: z.string(),
	auth: z.string(),
});

export type SubscribePushParamsT = z.infer<typeof SubscribePushParams>;

export const SubscribePushResponse = z.void();

export type SubscribePushResponseT = z.infer<typeof SubscribePushResponse>;

export const UnsubscribePushParams = z.object({
	endpoint: z.string().url(),
});

export type UnsubscribePushParamsT = z.infer<typeof UnsubscribePushParams>;

export const UnsubscribePushResponse = z.void();

export type UnsubscribePushResponseT = z.infer<typeof UnsubscribePushResponse>;

export const GetPushStatusParams = z.void();

export type GetPushStatusParamsT = z.infer<typeof GetPushStatusParams>;

export const GetPushStatusResponse = z.object({
	enabled: z.boolean(),
	endpoints: z.array(z.string()),
});

export type GetPushStatusResponseT = z.infer<typeof GetPushStatusResponse>;

export const TestPushParams = z.void();
export type TestPushParamsT = z.infer<typeof TestPushParams>;
export const TestPushResponse = z.void();
export type TestPushResponseT = z.infer<typeof TestPushResponse>;

export const UserInfoParams = z.void();

export type UserInfoParamsT = z.infer<typeof UserInfoParams>;

export const UserInfoResponse = z.object({
	id: z.string(),
	username: z.string(),
	latestRank: z.enum(RankType),
});

export type UserInfoResponseT = z.infer<typeof UserInfoResponse>;
