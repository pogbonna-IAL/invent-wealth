"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { declareDistributionFromStatement } from "@/app/actions/admin/distributions";
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
import { formatCurrencyNGN } from "@/lib/utils/currency";

interface DeclareDistributionButtonProps {
  propertyId: string;
  rentalStatementId: string;
  propertyName: string;
  netDistributable: number;
}

export function DeclareDistributionButton({
  propertyId,
  rentalStatementId,
  propertyName,
  netDistributable,
}: DeclareDistributionButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeclare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await declareDistributionFromStatement({
        propertyId,
        rentalStatementId,
      });

      if (result.success) {
        router.refresh();
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to declare distribution");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Declare Distribution
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Declare Distribution</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a distribution for <strong>{propertyName}</strong> and generate
            payouts for all investors based on their share ownership.
            <br />
            <br />
            <strong>Net Distributable:</strong> {formatCurrencyNGN(netDistributable, "NGN")}
            <br />
            <br />
            Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeclare} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Declare Distribution
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

