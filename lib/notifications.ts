const NOTIFICATION_ENABLED_KEY = "habits-notifications-enabled";
const LAST_NOTIFICATION_KEY = "habits-last-notification-date";
const NOTIFICATION_HOUR = 23; // 11 PM
const NOTIFICATION_MINUTE = 0;

let scheduledTimeout: ReturnType<typeof setTimeout> | null = null;

export function isNotificationSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"Notification" in window &&
		"serviceWorker" in navigator
	);
}

export function getNotificationPermission(): NotificationPermission | null {
	if (!isNotificationSupported()) return null;
	return Notification.permission;
}

export function isNotificationEnabled(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(NOTIFICATION_ENABLED_KEY) === "true";
}

export function setNotificationEnabled(enabled: boolean): void {
	localStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled ? "true" : "false");
}

export async function requestPermissionAndEnable(): Promise<boolean> {
	if (!isNotificationSupported()) return false;

	const permission = await Notification.requestPermission();
	if (permission === "granted") {
		setNotificationEnabled(true);
		scheduleNightlyNotification();
		await registerPeriodicSync();
		return true;
	}
	return false;
}

export function disableNotifications(): void {
	setNotificationEnabled(false);
	cancelScheduledNotification();
}

function getTodayDateString(): string {
	return new Date().toISOString().split("T")[0];
}

function hasNotifiedToday(): boolean {
	return localStorage.getItem(LAST_NOTIFICATION_KEY) === getTodayDateString();
}

function markNotifiedToday(): void {
	localStorage.setItem(LAST_NOTIFICATION_KEY, getTodayDateString());
}

function getMsUntilNotificationTime(): number {
	const now = new Date();
	const target = new Date();
	target.setHours(NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0);

	// If it's already past 11 PM, schedule for tomorrow
	if (now >= target) {
		target.setDate(target.getDate() + 1);
	}

	return target.getTime() - now.getTime();
}

export function cancelScheduledNotification(): void {
	if (scheduledTimeout) {
		clearTimeout(scheduledTimeout);
		scheduledTimeout = null;
	}
}

export async function showNotification(): Promise<void> {
	if (hasNotifiedToday()) return;

	try {
		const registration = await navigator.serviceWorker.ready;
		await registration.showNotification("Habits", {
			body: "Have you completed your habits today?",
			icon: "/icon-192x192.png",
			badge: "/icon-192x192.png",
			tag: "daily-reminder",
			renotify: true,
		});
		markNotifiedToday();
	} catch (error) {
		console.error("Failed to show notification:", error);
	}
}

export function scheduleNightlyNotification(): void {
	if (!isNotificationEnabled() || getNotificationPermission() !== "granted") {
		return;
	}

	cancelScheduledNotification();

	// If it's past 11 PM and we haven't notified today, fire immediately
	const now = new Date();
	if (now.getHours() >= NOTIFICATION_HOUR && !hasNotifiedToday()) {
		showNotification();
	}

	// Schedule the next notification
	const msUntilNext = getMsUntilNotificationTime();
	scheduledTimeout = setTimeout(() => {
		showNotification();
		// Reschedule for the next day
		scheduleNightlyNotification();
	}, msUntilNext);
}

async function registerPeriodicSync(): Promise<void> {
	try {
		const registration = await navigator.serviceWorker.ready;
		// Periodic Background Sync — Chrome 80+ only
		if ("periodicSync" in registration) {
			await (registration as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } })
				.periodicSync.register("daily-habit-notification", {
					minInterval: 12 * 60 * 60 * 1000, // 12 hours
				});
		}
	} catch {
		// Periodic sync not available or permission denied — that's fine,
		// the client-side setTimeout is the primary mechanism
	}
}
