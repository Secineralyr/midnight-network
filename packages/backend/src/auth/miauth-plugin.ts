import type { BetterAuthPlugin, User as BAUser } from 'better-auth';
import { createAuthEndpoint, APIError } from 'better-auth/api';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { User } from 'misskey-js/entities.js';
import { MiAuthScopes } from '@midnight-network/shared/auth-misskey';
import { setSessionCookie } from 'better-auth/cookies';
import type { WithExternalId } from '../auth';

export const miauthPlugin = () => {
	return {
		id: 'miauth',

		endpoints: {
			// Step 1 & 2: MiAuth認証を開始
			miauthAuthorize: createAuthEndpoint(
				'/miauth/authorize',
				{
					method: 'GET',
					query: z.object({
						host: z.string(),
						callbackUrl: z.string().optional(),
					}),
				},
				async (ctx) => {
					const { host, callbackUrl } = ctx.query;

					// セッションIDを生成
					const sessionId = randomUUID();

					// セッション情報を一時保存（internalAdapterを使用）
					await ctx.context.internalAdapter.createVerificationValue({
						identifier: `miauth:${sessionId}`,
						value: JSON.stringify({ host, callbackUrl }),
						expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分
					});

					// コールバックURL
					const appCallbackUrl = `${ctx.context.baseURL}/miauth/callback`;

					// MiAuth認証URLを構築
					const params = new URLSearchParams({
						name: 'MidNight Network',
						callback: appCallbackUrl,
						permission: MiAuthScopes.join(','),
					});

					const miauthUrl = `https://${host}/miauth/${sessionId}?${params.toString()}`;

					// リダイレクト
					throw ctx.redirect(miauthUrl);
				},
			),

			// Step 3: コールバック処理
			miauthCallback: createAuthEndpoint(
				'/miauth/callback',
				{
					method: 'GET',
					query: z.object({
						session: z.string(),
					}),
				},
				async (ctx) => {
					const { session: sessionId } = ctx.query;

					// 保存したセッション情報を取得
					const stored = await ctx.context.internalAdapter.findVerificationValue(`miauth:${sessionId}`);

					if (!stored) {
						throw new APIError('BAD_REQUEST', {
							message: 'Session not found or expired',
						});
					}

					const { host, callbackUrl } = JSON.parse(stored.value) as {
						host: string;
						callbackUrl?: string | undefined;
					};

					// セッション情報を削除
					await ctx.context.internalAdapter.deleteVerificationValue(stored.id);

					// MisskeyからアクセストークンとユーザーInfoを取得
					const checkUrl = `https://${host}/api/miauth/${sessionId}/check`;
					const response = await fetch(checkUrl, {
						method: 'POST',
					});

					if (!response.ok) {
						throw new APIError('BAD_REQUEST', {
							message: 'Failed to verify MiAuth session',
						});
					}

					const data = await response.json<{
						token: string;
						user: User;
					}>();
					const { token, user: misskeyUser } = data;

					// 既存アカウントを検索
					const existingAccount = await ctx.context.internalAdapter.findAccount(misskeyUser.id);

					let user: {
						id: string;
						createdAt: Date;
						updatedAt: Date;
						email: string;
						emailVerified: boolean;
						name: string;
						image?: string | null | undefined;
					} | null;

					if (existingAccount) {
						// 既存ユーザーを取得
						user = await ctx.context.internalAdapter.findUserById(existingAccount.userId);

						if (!user) {
							throw new APIError('INTERNAL_SERVER_ERROR', {
								message: 'User not found',
							});
						}

						// アクセストークンを更新
						await ctx.context.internalAdapter.updateAccount(existingAccount.id, { accessToken: token });
					} else {
						// 新規ユーザーとアカウントを作成
						const result = await ctx.context.internalAdapter.createOAuthUser(
							{
								name: misskeyUser.username,
								email: `${misskeyUser.username}@${host}`,
								emailVerified: false,
								externalId: '',
							} satisfies WithExternalId<Omit<BAUser, 'id' | 'createdAt' | 'updatedAt'>> as Omit<
								BAUser,
								'id' | 'createdAt' | 'updatedAt'
							>,
							{
								providerId: 'miauth',
								id: misskeyUser.id,
								userId: misskeyUser.id,
								accountId: misskeyUser.id,
								accessToken: token,
							},
						);

						user = result.user;
					}

					// セッション作成
					const session = await ctx.context.internalAdapter.createSession(user.id);

					// セッションCookieを設定
					await ctx.context.setNewSession({
						session,
						user,
					});

					// リダイレクト
					await setSessionCookie(ctx, { session, user });
					throw ctx.redirect(callbackUrl || '/');
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
