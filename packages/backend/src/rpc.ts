import { contract } from '@midnight-network/shared/rpc';
import { implement, ORPCError } from '@orpc/server';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';
import { auth } from './auth';
import { rankTop, searchUser, todayTop } from './rpc/handler';
import { averageTime, matchTime, rank, rankHistogram, wr } from './rpc/leaderboard/handler';
import { getSettings, lastResult, setSettings, userInfo } from './rpc/me/handler';
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
	searchUser: base.searchUser.handler((opt) => searchUser(opt.input)),
	todayTop: base.todayTop.handler((opt) => todayTop(opt.input)),
	rankTop: base.rankTop.handler((opt) => rankTop(opt.input)),
	me: {
		lastResult: authorized.me.lastResult.handler((opt) => lastResult(opt.context, opt.input)),
		getSettings: authorized.me.getSettings.handler((opt) => getSettings(opt.context, opt.input)),
		setSettings: authorized.me.setSettings.handler((opt) => setSettings(opt.context, opt.input)),
		userInfo: authorized.me.userInfo.handler((opt) => userInfo(opt.context, opt.input)),
	},
	leaderboard: {
		averageTime: maybeAuthorized.leaderboard.averageTime.handler((opt) => averageTime(opt.input)),
		matchTime: maybeAuthorized.leaderboard.matchTime.handler((opt) => matchTime(opt.input)),
		rank: maybeAuthorized.leaderboard.rank.handler((opt) => rank(opt.input)),
		rankHistogram: maybeAuthorized.leaderboard.rankHistogram.handler((opt) => rankHistogram(opt.input)),
		wr: maybeAuthorized.leaderboard.wr.handler((opt) => wr(opt.input)),
	},
	user: {
		profile: base.user.profile.handler((opt) => profile(opt.input)),
		earnedPtChart: base.user.earnedPtChart.handler((opt) => earnedPtChart(opt.input)),
		heatmapChart: base.user.heatmapChart.handler((opt) => heatmapChart(opt.input)),
		postTimeChart: base.user.postTimeChart.handler((opt) => postTimeChart(opt.input)),
		radarChart: base.user.radarChart.handler((opt) => radarChart(opt.input)),
		totalPtChart: base.user.totalPtChart.handler((opt) => totalPtChart(opt.input)),
	},
});
