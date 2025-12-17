import pRetry from 'p-retry';

type Action<T = void> = (() => T) | (() => Promise<T>);

export function createRetryTask<T = void>(f: Action<T>) {
	return pRetry(f, {
		onFailedAttempt(context) {
			console.error(context);
		},
		retries: 20,
		minTimeout: 5000,
	});
}
