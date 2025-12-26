"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppShortcutsMenu } from "@/components/pwa/app-shortcuts-menu";
import Image from "next/image";

interface AppNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function AppNavbar({ user }: AppNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/invest", label: "Invest" },
    { href: "/income", label: "Income" },
    { href: "/statements", label: "Statements" },
    { href: "/transactions", label: "Transactions" },
    { href: "/documents", label: "Documents" },
    { href: "/settings", label: "Settings" },
  ];

  const userInitials = (() => {
    if (user?.name) {
      const nameParts = user.name.trim().split(" ").filter(Boolean);
      if (nameParts.length >= 2) {
        // First letter of first name + first letter of last name
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1) {
        // Only one name, use first two letters
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    // Fallback to email first letter
    return user?.email?.[0].toUpperCase() || "U";
  })();

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Dashboard navigation"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-all hover:opacity-80 shrink-0"
          aria-label="InventWealth Dashboard"
        >
          <Image
            src="/invent-alliance-logo-small.svg"
            alt="Invent Alliance"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <h1 className="text-xs font-bold text-foreground whitespace-nowrap mt-0.5">
            InventWealth
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isActive
                      ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                      : "hover:text-primary hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/dashboard/properties">
            <Button
              variant="ghost"
              size="sm"
              className={
                pathname === "/dashboard/properties" || pathname.startsWith("/dashboard/properties/")
                  ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                  : "hover:text-primary hover:bg-muted"
              }
            >
              Browse Properties
            </Button>
          </Link>
          <ThemeSwitcher />
          <div className="flex items-center gap-2 pl-2 border-l">
            <Link href="/settings">
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-[#253E8D] transition-all">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <AppShortcutsMenu isAdmin={user?.role === "ADMIN"} />
          <ThemeSwitcher />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle menu"
                className="group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-[#253E8D]/10 hover:text-[#253E8D] transition-all duration-300 hover:scale-110"
              >
                <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1 ${
                        isActive
                          ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                          : "hover:text-primary hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="pt-4 border-t space-y-2">
                  <Link
                    href="/dashboard/properties"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1 ${
                      pathname === "/dashboard/properties" || pathname.startsWith("/dashboard/properties/")
                        ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                        : "hover:text-primary hover:bg-muted"
                    }`}
                  >
                    Browse Properties
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-[#253E8D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                    Account Settings
                  </Link>
                  <SignOutButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

