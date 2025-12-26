import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BulkDistributionForm } from "@/components/admin/distributions/bulk-distribution-form";

export const dynamic = "force-dynamic";

export default async function BulkDistributionPage() {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      totalShares: true,
      availableShares: true,
    },
    orderBy: { name: "asc" },
  });

  // Get recent rental statements for reference
  const recentStatements = await prisma.rentalStatement.findMany({
    include: {
      property: {
        select: {
          name: true,
        },
      },
      distributions: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      periodStart: "desc",
    },
    take: 20,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/distributions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Bulk Distribution Creation</h1>
          <p className="text-muted-foreground">
            Create distributions for multiple properties and periods at once
          </p>
        </div>
      </div>

      <BulkDistributionForm properties={properties} recentStatements={recentStatements} />
    </div>
  );
}

