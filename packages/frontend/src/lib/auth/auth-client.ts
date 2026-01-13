import { createAuthClient as createAuthClientOriginal } from 'better-auth/client';
import { miauthClient } from './miauth-client';

export function createAuthClient() {
	return createAuthClientOriginal({
		baseURL: import.meta.env.VITE_API_ROOT,
		basePath: '/api/auth',
		plugins: [miauthClient()],
		fetchOptions: {
			credentials: 'include',
		},
	});
}
