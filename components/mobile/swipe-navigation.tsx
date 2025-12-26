"use client";

import { useEffect, ReactNode } from "react";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { useRouter, usePathname } from "next/navigation";

interface SwipeNavigationProps {
  children: ReactNode;
  enabled?: boolean;
}

// Define navigation routes for swipe navigation
const navigationRoutes: Record<string, { prev?: string; next?: string }> = {
  "/dashboard": { next: "/dashboard/invest" },
  "/dashboard/invest": { prev: "/dashboard", next: "/income" },
  "/income": { prev: "/dashboard/invest", next: "/statements" },
  "/statements": { prev: "/income", next: "/settings" },
  "/settings": { prev: "/statements" },
};

export function SwipeNavigation({ children, enabled = true }: SwipeNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { swipeDirection } = useSwipeGesture({
    enabled,
    threshold: 100,
    navigationEnabled: false, // We'll handle navigation manually
    onSwipeLeft: () => {
      // Swipe left = go to next page
      const route = navigationRoutes[pathname];
      if (route?.next) {
        router.push(route.next);
      }
    },
    onSwipeRight: () => {
      // Swipe right = go to previous page
      const route = navigationRoutes[pathname];
      if (route?.prev) {
        router.push(route.prev);
      } else {
        // Fallback: go back in browser history
        router.back();
      }
    },
  });

  return <>{children}</>;
}

