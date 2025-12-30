import { createAuthClient as createAuthClientOriginal } from 'better-auth/client';
import { genericOAuthClient } from 'better-auth/client/plugins';

export function createAuthClient() {
	return createAuthClientOriginal({
		baseURL: import.meta.env.VITE_API_ROOT,
		basePath: '/api/auth',
		plugins: [genericOAuthClient()],
	});
}
