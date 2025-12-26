"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Application Error</CardTitle>
              </div>
              <CardDescription>
                A critical error occurred. Please refresh the page or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && (
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm font-mono text-destructive">{error.message}</p>
                  {error.digest && (
                    <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={reset}>Try Again</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")}>
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}

