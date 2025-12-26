"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the page
      if (window.scrollY > 0) return;

      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // Only allow pull down
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (startY.current === 0) return;

      const distance = currentY.current - startY.current;

      if (distance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default: refresh the page
            router.refresh();
          }
        } catch (error) {
          console.error("Refresh error:", error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setIsPulling(false);
            setPullDistance(0);
            startY.current = 0;
            currentY.current = 0;
          }, 300);
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
        currentY.current = 0;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, threshold, isRefreshing, onRefresh, router]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowIndicator = isPulling || isRefreshing;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      {shouldShowIndicator && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`,
            opacity: pullProgress,
            transform: `translateY(${Math.min(pullDistance - threshold, 0)}px)`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#F58220]" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-6 w-6 rounded-full border-2 border-[#F58220] border-t-transparent transition-transform duration-200"
                style={{
                  transform: `rotate(${pullProgress * 360}deg)`,
                }}
              />
              <span className="text-xs text-muted-foreground">
                {pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
              </span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

