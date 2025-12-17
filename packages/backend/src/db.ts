import { env } from 'cloudflare:workers';
import { PrismaClient } from '@midnight-network/entity/client';
import { PrismaD1 } from '@prisma/adapter-d1';

const adapter = new PrismaD1(env.DB);
export const prisma = new PrismaClient({ adapter });
