"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showInstallPrompt, setShowInstallPrompt] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		console.log("PWA Install Prompt: Component mounted");
		
		// Check if app is already installed
		if (window.matchMedia("(display-mode: standalone)").matches) {
			console.log("PWA Install Prompt: App is already installed");
			setIsInstalled(true);
			return;
		}

		// Check if service worker is registered
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistration().then(registration => {
				console.log("PWA Install Prompt: Service Worker registration:", registration);
			});
		}

		// Check if manifest is accessible
		fetch('/manifest.json')
			.then(response => {
				console.log("PWA Install Prompt: Manifest accessible:", response.ok);
				return response.json();
			})
			.then(manifest => {
				console.log("PWA Install Prompt: Manifest content:", manifest);
			})
			.catch(error => {
				console.error("PWA Install Prompt: Manifest error:", error);
			});

		// Listen for the beforeinstallprompt event
		const handleBeforeInstallPrompt = (e: Event) => {
			console.log("PWA Install Prompt: beforeinstallprompt event fired");
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowInstallPrompt(true);
		};

		// Listen for app installed event
		const handleAppInstalled = () => {
			console.log("PWA Install Prompt: App installed event fired");
			setIsInstalled(true);
			setShowInstallPrompt(false);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		console.log("PWA Install Prompt: Event listeners added");

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setIsInstalled(true);
			setShowInstallPrompt(false);
		}

		setDeferredPrompt(null);
	};

	const handleDismiss = () => {
		setShowInstallPrompt(false);
		setDeferredPrompt(null);
	};

	if (isInstalled || !showInstallPrompt) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="flex-shrink-0">
						<Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
							Install Habits
						</h3>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Add to your home screen for quick access
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<button
						onClick={handleInstallClick}
						className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
					>
						Install
					</button>
					<button
						onClick={handleDismiss}
						className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
