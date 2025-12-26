"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSession } from "next-auth/react";
import Image from "next/image";

export function MarketingNavbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch by only rendering session-dependent content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-all hover:opacity-80"
          aria-label="InventWealth Home"
        >
          <Image
            src="/invent-alliance-logo-small.svg"
            alt="Invent Alliance"
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <h1 className="text-xl font-bold text-foreground">
            InventWealth
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/properties"
            className={`text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1 ${
              pathname === "/properties" || pathname.startsWith("/properties/")
                ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                : "hover:text-primary hover:bg-muted"
            }`}
          >
            Properties
          </Link>
          <Link
            href="/how-it-works"
            className={`text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1 ${
              pathname === "/how-it-works" || pathname.startsWith("/how-it-works/")
                ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                : "hover:text-primary hover:bg-muted"
            }`}
          >
            How It Works
          </Link>
          <Link
            href="/faq"
            className={`text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-1 ${
              pathname === "/faq" || pathname.startsWith("/faq/")
                ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                : "hover:text-primary hover:bg-muted"
            }`}
          >
            FAQ
          </Link>
          {!isMounted ? (
            // Placeholder during SSR to prevent hydration mismatch
            <Link href="/auth/signin">
              <Button size="sm" className="focus-visible:ring-2" suppressHydrationWarning>
                Sign In
              </Button>
            </Link>
          ) : session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="focus-visible:ring-2" suppressHydrationWarning>
                  Dashboard
                </Button>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/auth/signin">
              <Button size="sm" className="focus-visible:ring-2" suppressHydrationWarning>
                Sign In
              </Button>
            </Link>
          )}
          <ThemeSwitcher />
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeSwitcher />
          {isMounted ? (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle menu"
                  className="group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-[#253E8D]/10 hover:text-[#253E8D] transition-all duration-300 hover:scale-110"
                  suppressHydrationWarning
                >
                  <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                  <Link
                    href="/properties"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1 ${
                      pathname === "/properties" || pathname.startsWith("/properties/")
                        ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                        : "hover:text-primary hover:bg-muted"
                    }`}
                  >
                    Properties
                  </Link>
                  <Link
                    href="/how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1 ${
                      pathname === "/how-it-works" || pathname.startsWith("/how-it-works/")
                        ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                        : "hover:text-primary hover:bg-muted"
                    }`}
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1 ${
                      pathname === "/faq" || pathname.startsWith("/faq/")
                        ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                        : "hover:text-primary hover:bg-muted"
                    }`}
                  >
                    FAQ
                  </Link>
                  {isMounted && session ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
                      >
                        Dashboard
                      </Link>
                      <div className="pt-4 border-t">
                        <SignOutButton />
                      </div>
                    </>
                  ) : (
                    <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full focus-visible:ring-2">Sign In</Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              className="group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-[#253E8D]/10 hover:text-[#253E8D] transition-all duration-300 hover:scale-110"
              onClick={() => setMobileMenuOpen(true)}
              suppressHydrationWarning
            >
              <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
