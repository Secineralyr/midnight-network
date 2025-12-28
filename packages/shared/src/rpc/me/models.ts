import { z } from 'zod';
import { RankType } from '../../rank';

export const SettingType = z.object({
	showRank: z.boolean(),
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
	RankUp: 0,
	None: 0,
	RankDown: -1,
} as const;

export const LastResultResponse = z.optional(
	z.object({
		targetDate: z.date(),
		place: z.number(),
		time: z.number(),
		earnedPt: z.number(),
		latestTotalPt: z.number(),
		latestRank: z.enum(RankType),
		rankShift: z.enum(RankShiftType),
	}),
);

export type LastResultResponseT = z.infer<typeof LastResultResponse>;
