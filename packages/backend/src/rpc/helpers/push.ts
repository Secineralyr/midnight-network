// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface PushSubscriptionEntry {
	endpoint: string;
	p256dh: string;
	auth: string;
}

export function parsePushSubscriptions(json: string | null | undefined): PushSubscriptionEntry[] {
	if (!json) {
		return [];
	}
	try {
		const parsed = JSON.parse(json);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
