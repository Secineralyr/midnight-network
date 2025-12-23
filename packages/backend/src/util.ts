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

export function numberBetween(target: number, before: number, after: number): boolean {
	if (before > after) {
		return false;
	}

	return before <= target && after >= target;
}
