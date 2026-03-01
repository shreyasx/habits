"use client";

import { useEffect } from "react";
import {
	isNotificationSupported,
	isNotificationEnabled,
	scheduleNightlyNotification,
	cancelScheduledNotification,
} from "@/lib/notifications";

export function NotificationScheduler() {
	useEffect(() => {
		if (!isNotificationSupported() || !isNotificationEnabled()) return;
		if (Notification.permission !== "granted") return;

		scheduleNightlyNotification();

		return () => cancelScheduledNotification();
	}, []);

	return null;
}
