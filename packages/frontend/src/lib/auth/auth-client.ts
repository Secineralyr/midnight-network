import { authBasePath } from '@midnight-network/shared/auth-routes';
import { createAuthClient as createAuthClientOriginal } from 'better-auth/client';
import { genericOAuthClient } from 'better-auth/client/plugins';

export function createAuthClient(origin: string) {
	return createAuthClientOriginal({
		baseURL: origin,
		basePath: authBasePath,
		plugins: [genericOAuthClient()],
	});
}
