"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Building2, FileText, DollarSign, Users, Settings, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering Sheet after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/properties", label: "Properties", icon: Building2 },
    { href: "/admin/documents", label: "Documents", icon: FileText },
    { href: "/admin/statements", label: "Rental Statements", icon: DollarSign },
    { href: "/admin/distributions", label: "Distributions", icon: DollarSign },
    { href: "/admin/users", label: "User Investments", icon: Users },
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
    return user?.email?.[0].toUpperCase() || "A";
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="navigation"
        aria-label="Admin navigation"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/admin"
            className="flex items-center space-x-2 text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label="Admin Dashboard"
          >
            InventWealth Admin
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center mx-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 whitespace-nowrap ${
                      isActive
                        ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                        : "hover:text-primary hover:bg-muted"
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Tablet Navigation - Show only key items */}
          <div className="hidden md:flex lg:hidden items-center gap-1">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className={`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  pathname === "/admin" || pathname.startsWith("/admin/")
                    ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                    : "hover:text-primary hover:bg-muted"
                }`}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/properties">
              <Button
                variant="ghost"
                size="sm"
                className={`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  pathname === "/admin/properties" || pathname.startsWith("/admin/properties/")
                    ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                    : "hover:text-primary hover:bg-muted"
                }`}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Properties
              </Button>
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Management Interface
                <ExternalLink className="ml-2 h-3 w-3" />
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
            <ThemeSwitcher />
            {isMounted ? (
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
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1 ${
                            isActive
                              ? "font-semibold bg-[#F58220] text-white hover:bg-[#F58220]/90"
                              : "hover:text-primary hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <div className="pt-4 border-t space-y-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Management Interface
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Link>
                      <SignOutButton />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle menu"
                className="group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-[#253E8D]/10 hover:text-[#253E8D] transition-all duration-300 hover:scale-110"
                disabled
              >
                <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

