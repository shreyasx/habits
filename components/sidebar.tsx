"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, BarChart3, X } from "lucide-react";
import { useHabitsStore } from "@/lib/store";

export function Sidebar() {
	const { isSidebarOpen, setSidebarOpen, setCurrentPage, setCreateModalOpen } =
		useHabitsStore();
	const [isAnimating, setIsAnimating] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const touchStartX = useRef(0);
	const isDragging = useRef(false);

	useEffect(() => {
		if (isSidebarOpen) {
			setIsVisible(true);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsAnimating(true);
				});
			});
		} else {
			setIsAnimating(false);
			const timer = setTimeout(() => {
				setIsVisible(false);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isSidebarOpen]);

	// Close on Escape key
	useEffect(() => {
		if (!isSidebarOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setSidebarOpen(false);
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isSidebarOpen, setSidebarOpen]);

	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
		isDragging.current = true;
	}, []);

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (!isDragging.current) return;
			isDragging.current = false;
			const deltaX = e.changedTouches[0].clientX - touchStartX.current;
			if (deltaX < -50) {
				setSidebarOpen(false);
			}
		},
		[setSidebarOpen]
	);

	const handleMenuClick = (action: "addHabit" | "scorecard") => {
		setSidebarOpen(false);
		if (action === "addHabit") {
			setTimeout(() => setCreateModalOpen(true), 150);
		} else {
			setCurrentPage("scorecard");
		}
	};

	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50">
			{/* Backdrop */}
			<div
				className={`absolute inset-0 transition-opacity duration-300 ${
					isAnimating ? "bg-black/60" : "bg-black/0"
				}`}
				onClick={() => setSidebarOpen(false)}
			/>
			{/* Drawer panel */}
			<div
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				className={`absolute top-0 left-0 h-full w-4/5 max-w-[320px] bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-out ${
					isAnimating ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{/* Sidebar header */}
				<div className="flex items-center justify-between px-5 h-16 border-b border-gray-800">
					<h2 className="text-lg font-bold text-white">Habits</h2>
					<button
						onClick={() => setSidebarOpen(false)}
						className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Menu items */}
				<nav className="p-3 space-y-1">
					<button
						onClick={() => handleMenuClick("addHabit")}
						className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-gray-800/60 text-gray-300 hover:text-white transition-colors"
					>
						<Plus className="h-5 w-5" />
						<span className="text-sm font-medium">Add Habit</span>
					</button>
					<button
						onClick={() => handleMenuClick("scorecard")}
						className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-gray-800/60 text-gray-300 hover:text-white transition-colors"
					>
						<BarChart3 className="h-5 w-5" />
						<span className="text-sm font-medium">Scorecard</span>
					</button>
				</nav>
			</div>
		</div>
	);
}
