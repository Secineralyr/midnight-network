import { env } from 'cloudflare:workers';
import { MisskeyOAuthProviderId } from '@midnight-network/shared/auth-misskey';
import { authBasePath } from '@midnight-network/shared/auth-routes';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import { createHostToOrigin } from '../../shared/src/url';
import { prisma } from './db';

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
		genericOAuth({
			config: [
				{
					providerId: MisskeyOAuthProviderId,
					clientId: createHostToOrigin(env.BACKEND_HOST),
					authorizationUrl: `${createHostToOrigin(env.MK_HOST)}/oauth/authorize`,
					tokenUrl: `${createHostToOrigin(env.MK_HOST)}/oauth/token`,
					userInfoUrl: `${createHostToOrigin(env.MK_HOST)}/oauth/api/userinfo`,
					pkce: true,
				},
			],
		}),
	],
	user: {
		modelName: 'AuthUser',
	},
});
