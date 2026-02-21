// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from './generated/prisma/client';

const adapter = new PrismaD1(env.DB);
export const prisma = new PrismaClient({
	adapter,
	log: [
		{
			emit: 'event',
			level: 'query',
		},
		{
			emit: 'stdout',
			level: 'error',
		},
		{
			emit: 'stdout',
			level: 'info',
		},
		{
			emit: 'stdout',
			level: 'warn',
		},
	],
});

prisma.$on('query', (e) => {
	console.info(`Query: ${e.query}`);
	console.info(`Params: ${e.params}`);
	console.info(`Duration: ${e.duration}ms`);
});
