"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Send, FileCheck } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  submitDistributionForApproval,
  approveDistribution,
  rejectDistribution,
  declareDistribution,
} from "@/app/actions/admin/distributions";
import { DistributionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface DistributionApprovalButtonsProps {
  distributionId: string;
  status: DistributionStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
}

export function DistributionApprovalButtons({
  distributionId,
  status,
  approvedBy,
  approvedAt,
}: DistributionApprovalButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmitForApproval = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await submitDistributionForApproval({ distributionId });

      if (result.success) {
        router.refresh();
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to submit for approval");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await approveDistribution({
        distributionId,
        notes: notes || undefined,
      });

      if (result.success) {
        router.refresh();
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to approve distribution");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await rejectDistribution({
        distributionId,
        notes: notes || undefined,
      });

      if (result.success) {
        router.refresh();
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to reject distribution");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await declareDistribution({ distributionId });

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
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status:</span>
        <Badge
          variant={
            status === "PAID"
              ? "default"
              : status === "APPROVED"
              ? "default"
              : status === "PENDING_APPROVAL"
              ? "secondary"
              : "outline"
          }
        >
          {status.replace(/_/g, " ")}
        </Badge>
        {approvedBy && approvedAt && (
          <span className="text-xs text-muted-foreground">
            Approved {new Date(approvedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="sm" disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit for Approval</AlertDialogTitle>
                <AlertDialogDescription>
                  This will submit the distribution for approval. Once approved, it can be declared.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitForApproval} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {status === "PENDING_APPROVAL" && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm" disabled={isLoading}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Distribution</AlertDialogTitle>
                  <AlertDialogDescription>
                    Approve this distribution. Once approved, it can be declared.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approval-notes">Notes (Optional)</Label>
                    <Textarea
                      id="approval-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this approval..."
                      rows={3}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isLoading}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Distribution</AlertDialogTitle>
                  <AlertDialogDescription>
                    Reject this distribution. It will be returned to DRAFT status.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejection-notes">Rejection Reason (Optional)</Label>
                    <Textarea
                      id="rejection-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Explain why this distribution is being rejected..."
                      rows={3}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {status === "APPROVED" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="sm" disabled={isLoading}>
                <FileCheck className="mr-2 h-4 w-4" />
                Declare Distribution
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Declare Distribution</AlertDialogTitle>
                <AlertDialogDescription>
                  This will declare the distribution and create transaction records for all payouts.
                  This action cannot be undone.
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
                  Declare
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

