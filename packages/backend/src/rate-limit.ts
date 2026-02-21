// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { env } from 'cloudflare:workers';

/**
 * Extract client IP address from request headers
 */
export function getClientIP(headers: Headers): string {
	// CF-Connecting-IP is always set in production Cloudflare Workers
	const cfIP = headers.get('CF-Connecting-IP');
	if (cfIP) {
		return cfIP;
	}

	// Fallback for local development/testing
	const forwardedFor = headers.get('X-Forwarded-For');
	if (forwardedFor) {
		// X-Forwarded-For can contain multiple IPs; use the first (client IP)
		const firstIP = forwardedFor.split(',')[0];
		if (firstIP) {
			return firstIP.trim();
		}
	}

	// Default for local development without proxy
	return '127.0.0.1';
}

/**
 * Check rate limit for a request
 * @returns true if request is allowed, false if rate limited
 */
export async function checkRateLimit(request: Request): Promise<boolean> {
	// Skip rate limiting in development
	if (env.ENVIRONMENT !== 'production') {
		return true;
	}

	const ip = getClientIP(request.headers);
	const { success } = await env.RATE_LIMITER.limit({ key: `api:${ip}` });
	return success;
}

/**
 * Create HTTP 429 Too Many Requests response
 */
export function createRateLimitResponse(): Response {
	return new Response(
		JSON.stringify({
			error: 'Too Many Requests',
			message: 'Rate limit exceeded. Please try again later.',
			code: 'RATE_LIMIT_EXCEEDED',
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': '60',
			},
		},
	);
}
