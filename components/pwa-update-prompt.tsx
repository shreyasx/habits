"use client";

import { useEffect } from "react";

export function PWAUpdatePrompt() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;

		let updateInterval: ReturnType<typeof setInterval>;

		const setup = async () => {
			try {
				const reg = await navigator.serviceWorker.getRegistration();
				if (!reg) return;

				// Check for updates every 30 minutes
				reg.update();
				updateInterval = setInterval(() => reg.update(), 30 * 60 * 1000);

				// When a new worker is found, auto-activate it
				reg.addEventListener("updatefound", () => {
					const newWorker = reg.installing;
					if (!newWorker) return;
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							newWorker.postMessage({ type: "SKIP_WAITING" });
						}
					});
				});

				// Reload when the new worker takes over
				navigator.serviceWorker.addEventListener(
					"controllerchange",
					() => window.location.reload()
				);
			} catch (error) {
				console.error("SW registration error:", error);
			}
		};

		navigator.serviceWorker.ready.then(setup);

		return () => clearInterval(updateInterval);
	}, []);

	return null;
}
