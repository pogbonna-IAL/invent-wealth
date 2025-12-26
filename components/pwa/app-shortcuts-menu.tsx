"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home,
  TrendingUp,
  Wallet,
  FileText,
  Settings,
  Building2,
  Users,
  BarChart3,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const shortcuts = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "View your investment overview",
  },
  {
    name: "Invest",
    href: "/dashboard/invest",
    icon: TrendingUp,
    description: "Browse investment opportunities",
  },
  {
    name: "Properties",
    href: "/dashboard/properties",
    icon: Building2,
    description: "Explore available properties",
  },
  {
    name: "Income",
    href: "/income",
    icon: Wallet,
    description: "View your income and distributions",
  },
  {
    name: "Statements",
    href: "/statements",
    icon: FileText,
    description: "View rental statements",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Manage your account settings",
  },
];

const adminShortcuts = [
  {
    name: "Admin Dashboard",
    href: "/admin",
    icon: BarChart3,
    description: "Admin overview",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage users",
  },
];

interface AppShortcutsMenuProps {
  isAdmin?: boolean;
}

export function AppShortcutsMenu({ isAdmin = false }: AppShortcutsMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const allShortcuts = isAdmin ? [...shortcuts, ...adminShortcuts] : shortcuts;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open shortcuts menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Quick Access</SheetTitle>
          <SheetDescription>Navigate quickly to any section</SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {allShortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            const isActive = pathname === shortcut.href || pathname.startsWith(shortcut.href + "/");

            return (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-[#F58220] bg-[#F58220]/10"
                    : "border-border hover:border-[#F58220]/50 hover:bg-muted"
                }`}
              >
                <Icon
                  className={`h-8 w-8 mb-2 ${
                    isActive ? "text-[#F58220]" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-medium text-center ${
                    isActive ? "text-[#F58220]" : "text-foreground"
                  }`}
                >
                  {shortcut.name}
                </span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {shortcut.description}
                </span>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

