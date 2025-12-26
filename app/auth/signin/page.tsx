import { SignInForm } from "@/components/auth/signin-form";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In / Sign Up</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with magic link or create an account with email and password
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
    </MarketingLayout>
  );
}

