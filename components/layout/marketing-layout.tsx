import { MarketingNavbar } from "./marketing-navbar";
import { MarketingFooter } from "./marketing-footer";
import { FloatingWhatsApp } from "@/components/marketing/floating-whatsapp";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main className="flex-1" role="main">
        {children}
      </main>
      <MarketingFooter />
      <FloatingWhatsApp />
    </div>
  );
}

