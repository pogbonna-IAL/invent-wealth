import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DistributionNotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 text-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Distribution Not Found</CardTitle>
          <CardDescription>
            The distribution you're looking for doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/admin/distributions">
            <Button className="w-full">Back to Distributions</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="w-full">
              Admin Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

