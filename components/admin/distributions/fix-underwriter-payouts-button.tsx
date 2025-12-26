"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fixUnderWriterPayouts } from "@/app/actions/admin/distributions";
import { Loader2, Wrench, CheckCircle2, XCircle } from "lucide-react";

interface FixUnderwriterPayoutsButtonProps {
  distributionId: string;
}

export function FixUnderwriterPayoutsButton({
  distributionId,
}: FixUnderwriterPayoutsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFix = async () => {
    setIsFixing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await fixUnderWriterPayouts({ distributionId });

      if (result.success) {
        setSuccess(result.message || `Fixed ${result.fixed} under_writer payout(s)`);
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1500);
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to fix under_writer payouts");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fix under_writer payouts";
      setError(errorMessage);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isFixing}>
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Wrench className="mr-2 h-4 w-4" />
              Fix Underwriter Shares
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fix Underwriter Payout Shares</AlertDialogTitle>
          <AlertDialogDescription>
            This will recalculate the under_writer payout shares based on actual
            confirmed investments. The sharesAtRecord will be updated to reflect
            the correct number of unsold shares.
            <br />
            <br />
            <strong>Note:</strong> If the distribution is DRAFT, the payout
            amount will also be recalculated. For other statuses, only the
            sharesAtRecord will be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isFixing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleFix}
            disabled={isFixing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isFixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Fix Shares"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

