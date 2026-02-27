// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';
import { authBasePath } from '@midnight-network/shared/auth-routes';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createHostToOrigin } from '../../shared/src/url';
import { miauthPlugin } from './auth/miauth-plugin';
import { prisma } from './db';

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
	secondaryStorage: {
		get: async (key) => await env.SESSION.get(key),
		set: async (key, value, ttl) => {
			await env.SESSION.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
		},
		delete: async (key) => await env.SESSION.delete(key),
	},
	session: {
		storeSessionInDatabase: true,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
			strategy: 'jwe',
		},
	},
	user: {
		modelName: 'AuthUser',
		additionalFields: {
			pushSubscriptions: {
				type: 'string',
				required: false,
				defaultValue: null,
				input: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: (user: unknown) => {
					if (!isExternalId(user)) {
						return Promise.resolve();
					}
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
