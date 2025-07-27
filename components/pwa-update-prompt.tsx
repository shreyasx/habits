"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Download, RefreshCw, X } from "lucide-react";

interface PWAUpdatePromptProps {
	onUpdate?: () => void;
}

export function PWAUpdatePrompt({ onUpdate }: PWAUpdatePromptProps) {
	const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null);
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
		null
	);

	useEffect(() => {
		// Check if service worker is supported
		if (!("serviceWorker" in navigator)) return;

		// Get the existing registration or wait for it to be available
		const getRegistration = async () => {
			try {
				const reg = await navigator.serviceWorker.getRegistration();
				if (reg) {
					setRegistration(reg);

					// Check for updates periodically
					const checkForUpdates = () => {
						reg.update();
					};

					// Check immediately and then every 30 minutes
					checkForUpdates();
					const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

					// Listen for updates
					reg.addEventListener("updatefound", () => {
						console.log("Service Worker update found");
						const newWorker = reg.installing;
						if (newWorker) {
							newWorker.addEventListener("statechange", () => {
								console.log("Service Worker state changed:", newWorker.state);
								if (
									newWorker.state === "installed" &&
									navigator.serviceWorker.controller
								) {
									// New service worker is installed and waiting
									console.log("New Service Worker installed and waiting");
									setWaitingWorker(newWorker);
									setShowUpdatePrompt(true);
								}
							});
						}
					});

					// Listen for controller change (update applied)
					navigator.serviceWorker.addEventListener("controllerchange", () => {
						console.log("Service Worker controller changed - reloading page");
						// Reload the page to use the new service worker
						window.location.reload();
					});

					// Cleanup interval on unmount
					return () => clearInterval(updateInterval);
				}
			} catch (error) {
				console.error("Service Worker registration failed:", error);
			}
		};

		// Wait for the service worker to be ready
		navigator.serviceWorker.ready.then(getRegistration);
	}, []);

	const handleUpdate = () => {
		if (waitingWorker) {
			// Send message to service worker to skip waiting
			waitingWorker.postMessage({ type: "SKIP_WAITING" });
		}
		setShowUpdatePrompt(false);
		onUpdate?.();
	};

	const handleDismiss = () => {
		setShowUpdatePrompt(false);
	};

	const checkForUpdates = () => {
		if (registration) {
			console.log("Manual update check from PWA prompt");
			registration.update();
		}
	};

	// For development testing - show a test button
	if (process.env.NODE_ENV === "development") {
		return (
			<div className="fixed bottom-4 right-4 z-50">
				<Button
					onClick={() => setShowUpdatePrompt(true)}
					variant="outline"
					size="sm"
					className="bg-yellow-500 text-black hover:bg-yellow-600"
				>
					Test Update Prompt
				</Button>
			</div>
		);
	}

	if (!showUpdatePrompt) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Download className="h-5 w-5 text-blue-500" />
							<CardTitle>Update Available</CardTitle>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDismiss}
							className="h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<CardDescription>
						A new version of the app is available. Update now to get the latest
						features and improvements.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex space-x-2">
						<Button onClick={handleUpdate} className="flex-1">
							<RefreshCw className="mr-2 h-4 w-4" />
							Update Now
						</Button>
						<Button
							variant="outline"
							onClick={handleDismiss}
							className="flex-1"
						>
							Later
						</Button>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={checkForUpdates}
						className="w-full"
					>
						Check for Updates
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
