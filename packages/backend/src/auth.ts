import { env } from 'cloudflare:workers';
import { MisskeyOAuthProviderId } from '@midnight-network/shared/auth-misskey';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import { prisma } from './db';

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'sqlite',
	}),
	emailAndPassword: {
		enabled: false,
	},
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: MisskeyOAuthProviderId,
					clientId: `https://${env.WEB_HOST}`,
					discoveryUrl: `https://${env.MK_HOST}/.well-known/oauth-authorization-server`,
				},
			],
		}),
	],
	user: {
		modelName: 'AuthUser',
	},
});
