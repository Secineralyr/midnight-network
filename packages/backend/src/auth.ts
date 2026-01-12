import { env } from 'cloudflare:workers';
import { MisskeyOAuthProviderId } from '@midnight-network/shared/auth-misskey';
import { authBasePath } from '@midnight-network/shared/auth-routes';
import { betterAuth, type OAuth2Tokens, type OAuth2UserInfo } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import { createHostToOrigin } from '../../shared/src/url';
import { prisma } from './db';
import { APIClient } from 'misskey-js/api.js';

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
					clientSecret: '', // IndieAuthでは不要だが、Better Authの設定で必須
					authorizationUrl: `${createHostToOrigin(env.MK_HOST)}/oauth/authorize`,
					tokenUrl: 'https://dummy.invalid/token', // ダミー：カスタムgetTokenを使うため
					pkce: true,
					// MisskeyのIndieAuthはclient_secretなしでトークン交換を行う
					getToken: async ({ code, codeVerifier, redirectURI }): Promise<OAuth2Tokens> => {
						// デバッグ: code_verifierからcode_challengeを計算
						let computedChallenge = 'N/A';
						if (codeVerifier) {
							const encoder = new TextEncoder();
							const data = encoder.encode(codeVerifier);
							const hashBuffer = await crypto.subtle.digest('SHA-256', data);
							const hashArray = new Uint8Array(hashBuffer);
							const base64 = btoa(String.fromCharCode(...hashArray));
							computedChallenge = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
						}
						console.info(
							`Token exchange request: ${JSON.stringify({
								code: code?.substring(0, 10) + '...',
								codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'NULL',
								codeVerifierLength: codeVerifier?.length,
								computedChallenge,
								redirectURI,
								clientId: createHostToOrigin(env.BACKEND_HOST),
							})}`,
						);
						const body = new URLSearchParams({
							grant_type: 'authorization_code',
							code,
							redirect_uri: redirectURI,
							client_id: createHostToOrigin(env.BACKEND_HOST),
							code_verifier: codeVerifier ?? '',
						}).toString();
						console.info(`Token request body: ${body}`);
						const response = await fetch(`${createHostToOrigin(env.MK_HOST)}/oauth/token`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded',
							},
							body,
						});

						if (!response.ok) {
							const errorText = await response.text();
							console.error(`Token exchange failed: ${errorText}`);
							throw new Error(`Token exchange failed: ${errorText}`);
						}

						const data = (await response.json()) as {
							access_token: string;
							token_type: string;
							scope: string;
							expires_in?: number;
						};

						return {
							accessToken: data.access_token,
							tokenType: data.token_type,
							scopes: data.scope?.split(' ') ?? [],
							accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
							raw: data,
						};
					},
					getUserInfo: async ({ accessToken }): Promise<OAuth2UserInfo | null> => {
						const client = new APIClient({
							origin: createHostToOrigin(env.MK_HOST),
							credential: accessToken,
						});
						const data = await client.request('i', undefined);

						return {
							id: data.id,
							name: data.username,
							emailVerified: false,
						} satisfies OAuth2UserInfo;
					},
				},
			],
		}),
	],
	user: {
		modelName: 'AuthUser',
	},
});
