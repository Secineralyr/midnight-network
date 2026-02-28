// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

interface ExtendedNotificationOptions extends NotificationOptions {
	renotify?: boolean;
}

import { rankTypeValueToText } from '@midnight-network/shared/rank';
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

// Install: precache all assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting()),
	);
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

// Fetch: cache-first for assets, network-first for navigations
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	const url = new URL(event.request.url);

	// Skip cross-origin requests
	if (url.origin !== self.location.origin) {
		return;
	}

	// Skip API requests
	if (url.pathname.startsWith('/api')) {
		return;
	}

	if (ASSETS.includes(url.pathname)) {
		// Cache-first for known assets
		event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
	} else if (event.request.mode === 'navigate') {
		// Network-first for navigation, fall back to cached index.html
		event.respondWith(
			fetch(event.request).catch(() =>
				caches.match('/index.html').then((r) => r ?? new Response('Offline', { status: 503 })),
			),
		);
	}
});

// Push notification handler
self.addEventListener('push', (event) => {
	if (!event.data) {
		return;
	}

	try {
		const data = event.data.json();
		if (data.type !== 'match_result') {
			return;
		}

		const { targetDate, place, time, earnedPt, latestTotalPt, latestRank, rankShift, usedBorderProtection } = data;

		// ランクテキスト
		const rankText = rankTypeValueToText(latestRank);

		// ランクシフト・プロテクト表示
		let rankShiftText = '';
		if (usedBorderProtection) {
			rankShiftText = ' [プロテクト!]';
		} else if (rankShift > 0) {
			rankShiftText = ' [ランクアップ]';
		} else if (rankShift < 0) {
			rankShiftText = ' [ランクダウン]';
		}

		// フライング判定
		const placeText = place === -1 ? 'フライング' : `${place}位`;

		// タイムフォーマット（符号 + 末尾s）
		const timeText = `${time >= 0 ? '+' : ''}${time.toFixed(3)}s`;

		// 日付フォーマット (YYYY/MM/DD)
		const d = new Date(targetDate);
		const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

		// ポイント符号
		const ptSign = earnedPt >= 0 ? '+' : '';

		const title = `${dateStr}のリザルト`;
		const body = `順位: ${placeText}\nタイム: ${timeText}\n獲得pt: ${ptSign}${earnedPt}pt (合計: ${latestTotalPt}pt)\nランク: ${rankText}${rankShiftText}`;

		const options: ExtendedNotificationOptions = {
			body,
			icon: '/logo-192.png',
			badge: '/logo-192.png',
			tag: 'match-result',
			data: { url: '/' },
			renotify: true,
		};

		event.waitUntil(self.registration.showNotification(title, options));
	} catch (e) {
		console.error('Service worker: failed to handle push event', e);
	}
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const url = event.notification.data?.url || '/';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					return client.focus();
				}
			}
			return self.clients.openWindow(url);
		}),
	);
});
