"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
  navigationEnabled?: boolean; // Enable swipe left/right for navigation
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
  navigationEnabled = false,
}: SwipeGestureOptions = {}) {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  // Navigation history for swipe back/forward
  const navigationHistory = useRef<string[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Track navigation history
    navigationHistory.current.push(pathname);
    if (navigationHistory.current.length > 10) {
      navigationHistory.current.shift();
    }

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      currentX.current = startX.current;
      currentY.current = startY.current;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX.current === 0 && startY.current === 0) return;

      currentX.current = e.touches[0].clientX;
      currentY.current = e.touches[0].clientY;

      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;

      // Determine if user is swiping
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isSwiping.current = true;
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) {
        startX.current = 0;
        startY.current = 0;
        return;
      }

      const deltaX = currentX.current - startX.current;
      const deltaY = currentY.current - startY.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine swipe direction
      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            // Swipe right
            setSwipeDirection("right");
            if (navigationEnabled && navigationHistory.current.length > 1) {
              // Go back in history
              router.back();
            }
            onSwipeRight?.();
          } else {
            // Swipe left
            setSwipeDirection("left");
            onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            // Swipe down
            setSwipeDirection("down");
            onSwipeDown?.();
          } else {
            // Swipe up
            setSwipeDirection("up");
            onSwipeUp?.();
          }
        }
      }

      // Reset
      setTimeout(() => {
        setSwipeDirection(null);
        startX.current = 0;
        startY.current = 0;
        currentX.current = 0;
        currentY.current = 0;
        isSwiping.current = false;
      }, 300);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, navigationEnabled, router, pathname]);

  return { swipeDirection };
}

