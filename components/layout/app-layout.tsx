import { auth } from "@/server/auth";
import { AppNavbar } from "./app-navbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { SwipeNavigation } from "@/components/mobile/swipe-navigation";

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <SwipeNavigation>
      <div className="flex min-h-screen flex-col">
        <AppNavbar user={session?.user} />
        <PullToRefresh>
          <main className="flex-1 pb-16 md:pb-0" role="main">
            {children}
          </main>
        </PullToRefresh>
        <MobileBottomNav />
      </div>
    </SwipeNavigation>
  );
}

