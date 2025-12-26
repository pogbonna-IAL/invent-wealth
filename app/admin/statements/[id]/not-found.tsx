import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatementNotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 text-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Rental Statement Not Found</CardTitle>
          <CardDescription>
            The rental statement you're looking for doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/admin/statements">
            <Button className="w-full">Back to Statements</Button>
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

