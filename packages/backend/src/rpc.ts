import { contract } from '@midnight-network/shared/rpc';
import { implement, ORPCError } from '@orpc/server';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';
import { auth } from './auth';
import { rankTop, searchUser, todayTop } from './rpc/handler';
import { averageTime, matchTime, rank, rankHistogram, wr } from './rpc/leaderboard/handler';
import { getSettings, lastResult, setSettings } from './rpc/me/handler';
import { earnedPtChart, heatmapChart, postTimeChart, profile, radarChart, totalPtChart } from './rpc/user/handler';

export type RpcContext = RequestHeadersPluginContext & {
	env?: unknown;
};
export type AuthContext = ReturnType<typeof auth.api.getSession> extends Promise<infer T> ? Partial<NonNullable<T>> : never;

const base = implement(contract).$context<RpcContext>();

const maybeAuthedMiddleware = base.middleware(async ({ context, next }) => {
	const sessionData = context.reqHeaders
		? await auth.api.getSession({
				headers: context.reqHeaders,
			})
		: undefined;

	return next({
		context: {
			session: sessionData?.session,
			user: sessionData?.user,
		} satisfies AuthContext,
	});
});

const maybeAuthorized = base.use(maybeAuthedMiddleware);

const authedMiddleware = base.$context<AuthContext>().middleware(({ context, next }) => {
	if (!(context?.session && context?.user)) {
		throw new ORPCError('UNAUTHORIZED');
	}

	return next();
});

const authorized = maybeAuthorized.use(authedMiddleware);

export const router = base.router({
	searchUser: base.searchUser.handler(async (opt) => await searchUser(opt.input)),
	todayTop: base.todayTop.handler(async (opt) => await todayTop(opt.input)),
	rankTop: base.rankTop.handler(async (opt) => await rankTop(opt.input)),
	me: {
		lastResult: authorized.me.lastResult.handler(async (opt) => await lastResult(opt.context, opt.input)),
		getSettings: authorized.me.getSettings.handler(async (opt) => await getSettings(opt.context, opt.input)),
		setSettings: authorized.me.setSettings.handler(async (opt) => await setSettings(opt.context, opt.input)),
	},
	leaderboard: {
		averageTime: maybeAuthorized.leaderboard.averageTime.handler(async (opt) => await averageTime(opt.input)),
		matchTime: maybeAuthorized.leaderboard.matchTime.handler(async (opt) => await matchTime(opt.input)),
		rank: maybeAuthorized.leaderboard.rank.handler(async (opt) => await rank(opt.input)),
		rankHistogram: maybeAuthorized.leaderboard.rankHistogram.handler(async (opt) => await rankHistogram(opt.input)),
		wr: maybeAuthorized.leaderboard.wr.handler(async (opt) => await wr(opt.input)),
	},
	user: {
		profile: base.user.profile.handler(async (opt) => await profile(opt.input)),
		earnedPtChart: base.user.earnedPtChart.handler(async (opt) => await earnedPtChart(opt.input)),
		heatmapChart: base.user.heatmapChart.handler(async (opt) => await heatmapChart(opt.input)),
		postTimeChart: base.user.postTimeChart.handler(async (opt) => await postTimeChart(opt.input)),
		radarChart: base.user.radarChart.handler(async (opt) => await radarChart(opt.input)),
		totalPtChart: base.user.totalPtChart.handler(async (opt) => await totalPtChart(opt.input)),
	},
});
