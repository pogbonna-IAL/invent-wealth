import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SWRegister } from "./sw-register";

// Using Inter for a more premium, welcoming feel
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InventWealth - Fractional Property Ownership",
  description: "Invest in premium properties through fractional ownership and earn passive income from shortlet rentals.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InventWealth",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#253E8D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              {children}
              <InstallPrompt />
              <SWRegister />
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
