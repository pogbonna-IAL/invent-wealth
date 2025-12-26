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
import { sendPasswordResetEmail } from "@/app/actions/admin/users";
import { Loader2, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

interface SendPasswordResetButtonProps {
  userId: string;
  userEmail: string;
  userName?: string | null;
}

export function SendPasswordResetButton({
  userId,
  userEmail,
  userName,
}: SendPasswordResetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendPasswordResetEmail(userId);

      if (result.success) {
        setSuccess(result.message || "Password reset email sent successfully");
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 2000);
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to send password reset email");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to send password reset email";
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isSending}>
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <KeyRound className="mr-2 h-4 w-4" />
              Send Password Reset
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Password Reset Email</AlertDialogTitle>
          <AlertDialogDescription>
            This will send a password setup/reset email to{" "}
            <strong>{userEmail}</strong>
            {userName && ` (${userName})`}.
            <br />
            <br />
            The user will receive an email with a link to set up or reset their password.
            The link will expire in 24 hours.
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
          <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSend}
            disabled={isSending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Email"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

