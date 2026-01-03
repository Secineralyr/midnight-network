import { env } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from './generated/prisma/client';

let prismaClient: PrismaClient | null = null;

function getPrisma(): PrismaClient {
	if (!prismaClient) {
		const adapter = new PrismaD1(env.DB);
		prismaClient = new PrismaClient({ adapter });
	}
	return prismaClient;
}

// 後方互換性のためのProxy（既存コードの変更を最小化）
export const prisma = new Proxy({} as PrismaClient, {
	get(_, prop) {
		return getPrisma()[prop as keyof PrismaClient];
	},
});
