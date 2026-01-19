import { env } from 'cloudflare:workers';
import pRetry from 'p-retry';

type Action<T = void> = (() => T) | (() => Promise<T>);

export function createRetryTask<T = void>(f: Action<T>) {
	return pRetry(f, {
		onFailedAttempt(context) {
			console.error(`retry error: ${JSON.stringify(context)}`);
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
	targetTimeDate.setUTCMilliseconds(0);
	if (targetTimeDate > new Date()) {
		targetTimeDate.setDate(targetTimeDate.getDate() - 1);
	}
	return targetTimeDate.getTime();
}

function erf(x: number): number {
	const a1 = 0.254829592;
	const a2 = -0.284496736;
	const a3 = 1.421413741;
	const a4 = -1.453152027;
	const a5 = 1.061405429;
	const p = 0.3275911;

	const sign = x < 0 ? -1 : 1;
	x = Math.abs(x);

	const t = 1.0 / (1.0 + p * x);
	const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

	return sign * y;
}

export function normalCDF(z: number): number {
	return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

export function zScore(value: number, mean: number, std: number): number {
	return (value - mean) / std;
}
