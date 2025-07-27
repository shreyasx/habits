"use client";

import { useState } from "react";
import {
	Plus,
	CloudUpload,
	CloudCheck,
	CloudAlert,
	RefreshCw,
} from "lucide-react";
import { HabitModal } from "./habit-modal";
import { useHabitsStore } from "@/lib/store";
import { UserButton, useUser } from "@clerk/nextjs";

export function Header() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { pendingOperations, hasError } = useHabitsStore();
	const { user } = useUser();

	const checkForUpdates = async () => {
		if ("serviceWorker" in navigator) {
			try {
				const registration = await navigator.serviceWorker.getRegistration();
				if (registration) {
					registration.update();
					console.log("Manual update check triggered");
				}
			} catch (error) {
				console.error("Failed to check for updates:", error);
			}
		}
	};

	const showLoading = isLoading || pendingOperations > 0;

	// Determine which cloud icon to show
	const getCloudIcon = () => {
		if (hasError) {
			return <CloudAlert className="h-5 w-5 text-red-400" />;
		}
		if (showLoading) {
			return <CloudUpload className="h-5 w-5 animate-pulse text-blue-400" />;
		}
		return <CloudCheck className="h-5 w-5 text-green-400" />;
	};

	return (
		<>
			<header className="fixed top-0 left-0 right-0 bg-background border-b border-gray-800 z-10">
				<div className="px-4 flex items-center justify-between h-16">
					<div className="flex items-center gap-2">
						<div>
							<h1 className="text-2xl font-bold text-white">{`Habits`}</h1>
							<p className="text-xs text-gray-500 italic">
								&ldquo;excellence is not an act, but a habit&rdquo;
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<button className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white">
							{getCloudIcon()}
						</button>
						{process.env.NODE_ENV !== "production" && (
							<button
								onClick={checkForUpdates}
								className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
								title="Check for updates"
							>
								<RefreshCw className="h-5 w-5" />
							</button>
						)}
						<button
							onClick={() => setIsModalOpen(true)}
							className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
						>
							<Plus className="h-6 w-6" />
						</button>
						<div className="flex items-center gap-2">
							{user && (
								<span className="text-sm text-gray-300">
									{user.firstName || user.emailAddresses[0]?.emailAddress}
								</span>
							)}
							<UserButton
								appearance={{
									elements: {
										avatarBox: "w-8 h-8",
									},
								}}
							/>
						</div>
					</div>
				</div>
			</header>
			<HabitModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onLoadingChange={setIsLoading}
			/>
		</>
	);
}
