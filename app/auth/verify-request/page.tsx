import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingLayout } from "@/components/layout/marketing-layout";

export default function VerifyRequestPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              A sign in link has been sent to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please check your email and click the link to sign in. The link will
              expire in 24 hours.
            </p>
            <p className="text-xs text-muted-foreground">
              If you don't see the email, check your spam folder or try signing in again.
            </p>
          </CardContent>
        </Card>
      </div>
    </MarketingLayout>
  );
}

