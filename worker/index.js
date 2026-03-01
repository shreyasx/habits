// Custom service worker code for daily notifications
// Injected into the main service worker by next-pwa

const NOTIFICATION_STORAGE_KEY = "habits-last-notification-date";
const NOTIFICATION_HOUR = 23; // 11 PM

// Handle notification clicks — open the app
self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(
		clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			// Focus an existing window if available
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && "focus" in client) {
					return client.focus();
				}
			}
			// Otherwise open a new window
			return clients.openWindow("/");
		})
	);
});

// Handle periodic background sync (Chrome 80+)
self.addEventListener("periodicsync", (event) => {
	if (event.tag === "daily-habit-notification") {
		event.waitUntil(checkAndNotify());
	}
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SHOW_NOTIFICATION") {
		event.waitUntil(
			self.registration.showNotification(event.data.title, event.data.options)
		);
	}
});

async function checkAndNotify() {
	const now = new Date();
	const hour = now.getHours();
	const dateStr = now.toISOString().split("T")[0];

	// Only notify if it's around 11 PM and we haven't notified today
	if (hour >= NOTIFICATION_HOUR) {
		// Check if we already notified today using the Cache API (available in SW)
		const cache = await caches.open("notification-tracking");
		const response = await cache.match("last-notification-date");
		const lastDate = response ? await response.text() : null;

		if (lastDate !== dateStr) {
			await self.registration.showNotification("Habits", {
				body: "Have you completed your habits today?",
				icon: "/icon-192x192.png",
				badge: "/icon-192x192.png",
				tag: "daily-reminder",
				renotify: true,
			});
			// Mark as notified
			await cache.put(
				"last-notification-date",
				new Response(dateStr)
			);
		}
	}
}
