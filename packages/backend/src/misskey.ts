import { env } from 'cloudflare:workers';
import type { Endpoints } from 'misskey-js';
import { APIClient as MkAPIClient, type SwitchCaseResponseType } from 'misskey-js/api.js';
import { createRetryTask } from './util';

interface APIClient {
	request<E extends keyof Endpoints, P extends Endpoints[E]['req']>(
		endpoint: E,
		params: P,
		credential?: string | null,
	): Promise<SwitchCaseResponseType<E, P>>;
}

export function createRetryMisskeyApiClientFetcher() {
	const client: APIClient = new MkAPIClient({
		origin: `https://${env.MK_HOST}`,
		credential: env.API_TOKEN,
	});

	return async <E extends keyof Endpoints, P extends Endpoints[E]['req']>(
		e: E,
		p: P,
	): Promise<SwitchCaseResponseType<E, P>> => createRetryTask(() => client.request(e, p));
}
