"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert className="border-primary/50 bg-primary/5 mb-6">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary font-semibold">
        Complete Your Profile to Start Investing
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-2">
        <span>
          You need to complete your investor profile before you can make investments. This
          includes basic information, risk assessment, and terms acknowledgment.
        </span>
        <div className="flex items-center gap-2 ml-4">
          <Link href="/onboarding">
            <Button size="sm" className="focus-visible:ring-2">
              Complete Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 focus-visible:ring-2"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

