import { env } from 'cloudflare:workers';
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

export function getTargetTime() {
	const targetTimeDate = new Date();
	targetTimeDate.setUTCHours(env.TARGET_MATCH_HOUR);
	targetTimeDate.setUTCMinutes(env.TARGET_MATCH_MINUTES);
	targetTimeDate.setUTCSeconds(0);
	if (targetTimeDate > new Date()) {
		targetTimeDate.setDate(targetTimeDate.getDate() - 1);
	}
	return targetTimeDate.getTime();
}
