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
					discoveryUrl: createHostToOrigin(`${env.MK_HOST}/.well-known/oauth-authorization-server`),
				},
			],
		}),
	],
	user: {
		modelName: 'AuthUser',
	},
});
