import { env } from 'cloudflare:workers';
import { authBasePath } from '@midnight-network/shared/auth-routes';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createHostToOrigin } from '../../shared/src/url';
import { prisma } from './db';
import { miauthPlugin } from './auth/miauth-plugin';

export type WithExternalId<T> = T & { externalId: string };
function isExternalId<T>(v: T): v is WithExternalId<T> {
	return v && typeof v === 'object' && 'externalId' in v && typeof v.externalId === 'string';
}

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
	plugins: [miauthPlugin()],
	user: {
		modelName: 'AuthUser',
	},
	databaseHooks: {
		user: {
			create: {
				before: (user) => {
					if (!isExternalId(user)) {
						return Promise.resolve();
					}
					console.info('Better Auth: Before Action. contain external id');
					return Promise.resolve({ data: { id: user.externalId } });
				},
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: 'none',
			secure: true,
		},
	},
});
