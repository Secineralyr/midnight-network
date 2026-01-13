import type { BetterAuthClientPlugin } from 'better-auth/client';

const httpsRegex = /^https?:\/\//;

export const miauthClient = () => {
	return {
		id: 'miauth',
		getActions: ($fetch) => ({
			signInWithMiauth: async (data: { host: string; callbackUrl?: string }) => {
				const params = new URLSearchParams({
					host: data.host.replace(httpsRegex, ''),
					...(data.callbackUrl && { callbackUrl: data.callbackUrl }),
				});

				// 認証ページにリダイレクト
				await $fetch(`/miauth/authorize?${params.toString()}`);
			},
		}),
	} satisfies BetterAuthClientPlugin;
};
