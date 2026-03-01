"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseSwipeEdgeOptions {
	onSwipeRight: () => void;
	edgeWidth?: number;
	threshold?: number;
	enabled?: boolean;
}

export function useSwipeEdge({
	onSwipeRight,
	edgeWidth = 20,
	threshold = 50,
	enabled = true,
}: UseSwipeEdgeOptions) {
	const touchStartX = useRef(0);
	const touchStartY = useRef(0);
	const isEdgeTouch = useRef(false);

	const stableOnSwipeRight = useCallback(onSwipeRight, [onSwipeRight]);

	useEffect(() => {
		if (!enabled) return;

		const handleTouchStart = (e: TouchEvent) => {
			const startX = e.touches[0].clientX;
			if (startX <= edgeWidth) {
				isEdgeTouch.current = true;
				touchStartX.current = startX;
				touchStartY.current = e.touches[0].clientY;
			}
		};

		const handleTouchEnd = (e: TouchEvent) => {
			if (!isEdgeTouch.current) return;
			isEdgeTouch.current = false;

			const endX = e.changedTouches[0].clientX;
			const endY = e.changedTouches[0].clientY;
			const deltaX = endX - touchStartX.current;
			const deltaY = Math.abs(endY - touchStartY.current);

			if (deltaX > threshold && deltaX > deltaY) {
				stableOnSwipeRight();
			}
		};

		document.addEventListener("touchstart", handleTouchStart, {
			passive: true,
		});
		document.addEventListener("touchend", handleTouchEnd, {
			passive: true,
		});

		return () => {
			document.removeEventListener("touchstart", handleTouchStart);
			document.removeEventListener("touchend", handleTouchEnd);
		};
	}, [stableOnSwipeRight, edgeWidth, threshold, enabled]);
}
