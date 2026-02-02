// Push notification handler for MidNight Network
self.addEventListener('push', (event) => {
	if (!event.data) {
		return;
	}

	try {
		const data = event.data.json();
		if (data.type !== 'match_result') {
			return;
		}

		const place = data.place;
		const time = data.time;
		const earnedPt = data.earnedPt;
		const totalPt = data.totalPt;
		const rankUp = data.rankUp;
		const rank = data.rank;

		const ptSign = earnedPt >= 0 ? '+' : '';
		const rankUpText = rankUp ? ' [RANK UP!]' : '';

		const title = `今回のリザルト: ${place}位 | ${time}s`;
		const body = `順位: ${place}位\nタイム: ${time}\n獲得pt: ${ptSign}${earnedPt}pt (合計: ${totalPt}pt)\nランク: ${rank}${rankUpText}`;

		event.waitUntil(
			self.registration.showNotification(title, {
				body,
				icon: '/logo-192.png',
				badge: '/logo-192.png',
				tag: 'match-result',
				renotify: true,
				data: { url: '/' },
			}),
		);
	} catch (e) {
		console.error('sw-push: failed to handle push event', e);
	}
});

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
