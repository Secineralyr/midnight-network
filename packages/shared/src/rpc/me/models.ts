import { z } from 'zod';
import { RankType } from '../../rank';

export const SettingType = z.object({
	showRank: z.boolean(),
	showLeaderboardRank: z.boolean(),
	showLeaderboardRanking: z.boolean(),
	showProfileStats: z.boolean(),
	showProfileSearch: z.boolean(),
});

export const GetSettingsParams = z.void();

export const GetSettingsResponse = SettingType;

export const SetSettingsParams = SettingType.clone().partial();

export const SetSettingsResponse = z.void();

export const LastResultParams = z.void();

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
