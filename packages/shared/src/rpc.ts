import type { ContractRouterClient } from '@orpc/contract';
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const EchoMessageSchema = z.object({
	message: z.string().min(1),
});

export const contract = {
	ping: oc.input(z.void()).output(z.literal('pong')),
	echo: oc.input(EchoMessageSchema).output(EchoMessageSchema),
};

export type AppContract = typeof contract;
export type AppClient = ContractRouterClient<AppContract>;
