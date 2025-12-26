"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay to not interrupt initial page load
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 md:hidden shadow-lg animate-in slide-in-from-bottom-5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Install App</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowPrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Install InventWealth for a better mobile experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleInstall} className="w-full" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Install Now
        </Button>
      </CardContent>
    </Card>
  );
}

