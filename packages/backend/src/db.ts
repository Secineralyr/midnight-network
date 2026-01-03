import { env } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from './generated/prisma/client';

let prismaClient: PrismaClient | null = null;

function getPrisma(): PrismaClient {
	console.info('getPrisma.called', { hasClient: !!prismaClient });
	if (!prismaClient) {
		console.info('getPrisma.init.start');
		console.info('getPrisma.init.envDB', { exists: !!env.DB, type: typeof env.DB });
		if (!env.DB) {
			console.error('getPrisma.init.error: env.DB is undefined!');
			throw new Error('D1 database binding (DB) is not available');
		}
		const adapter = new PrismaD1(env.DB);
		console.info('getPrisma.init.adapter.created');
		prismaClient = new PrismaClient({ adapter });
		console.info('getPrisma.init.client.created');
	}
	return prismaClient;
}

// 後方互換性のためのProxy（既存コードの変更を最小化）
export const prisma = new Proxy({} as PrismaClient, {
	get(_, prop) {
		console.info('prisma.proxy.get', { prop: String(prop) });
		const client = getPrisma();
		console.info('prisma.proxy.client.obtained');
		return client[prop as keyof PrismaClient];
	},
});
