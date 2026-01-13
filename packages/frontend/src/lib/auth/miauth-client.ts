import type { BetterAuthClientPlugin } from 'better-auth/client';

const httpsRegex = /^https?:\/\//;

export const miauthClient = () => {
	return {
		id: 'miauth',
		getActions: () => ({
			signInWithMiauth: (data: { host: string; callbackUrl?: string }) => {
				const params = new URLSearchParams({
					host: data.host.replace(httpsRegex, ''),
					...(data.callbackUrl && { callbackUrl: data.callbackUrl }),
				});

				// OAuth認証はフルページリダイレクトが必要（fetchではCORSエラーになる）
				const baseURL = import.meta.env.VITE_API_ROOT;
				const authUrl = `${baseURL}/api/auth/miauth/authorize?${params.toString()}`;
				window.location.href = authUrl;
			},
		}),
	} satisfies BetterAuthClientPlugin;
};
