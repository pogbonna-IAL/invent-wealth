"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, TrendingUp, FileText, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/invest", label: "Invest", icon: TrendingUp },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/statements", label: "Statements", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  
  // Only show on mobile and for authenticated routes
  const isMobileRoute = pathname.startsWith("/dashboard") || 
                       pathname.startsWith("/income") || 
                       pathname.startsWith("/statements") ||
                       pathname.startsWith("/transactions") ||
                       pathname.startsWith("/documents") ||
                       pathname.startsWith("/settings");

  if (!isMobileRoute) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-inset-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0",
                isActive
                  ? "text-[#F58220]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

