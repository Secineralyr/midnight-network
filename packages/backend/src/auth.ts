import { env } from 'cloudflare:workers';
import { authBasePath } from '@midnight-network/shared/auth-routes';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createHostToOrigin } from '../../shared/src/url';
import { prisma } from './db';
import { miauthPlugin } from './auth/miauth-plugin';

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'sqlite',
	}),
	baseURL: createHostToOrigin(env.BACKEND_HOST),
	basePath: authBasePath,
	trustedOrigins: [createHostToOrigin(env.WEB_HOST)],
	emailAndPassword: {
		enabled: false,
	},
	plugins: [
		miauthPlugin(),
	],
	user: {
		modelName: 'AuthUser',
	},
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
		},
		defaultCookieAttributes: {
			sameSite: 'none',
			secure: true,
		},
	},
});
