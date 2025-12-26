"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { href: "/dashboard", label: "Overview", value: "overview" },
  { href: "/dashboard/invest", label: "Invest", value: "invest" },
  { href: "/dashboard/wallet", label: "Wallet", value: "wallet" },
  { href: "/dashboard/learn", label: "Learn", value: "learn" },
  { href: "/dashboard/account", label: "Account", value: "account" },
];

export function DashboardNavTabs() {
  const pathname = usePathname();
  const currentTab = tabs.find((tab) => pathname === tab.href)?.value || "overview";

  return (
    <Tabs value={currentTab} className="w-full">
      <TabsList className="mb-8">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <TabsTrigger value={tab.value}>{tab.label}</TabsTrigger>
          </Link>
        ))}
      </TabsList>
    </Tabs>
  );
}

