import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ScheduledDistributionsList } from "@/components/admin/distributions/scheduled-distributions-list";

export const dynamic = "force-dynamic";

export default async function DistributionSchedulePage() {
  // In a real implementation, you'd have a ScheduledDistribution model
  // For now, we'll show distributions that are scheduled for future dates
  const upcomingDistributions = await prisma.distribution.findMany({
    where: {
      declaredAt: {
        gte: new Date(),
      },
    },
    include: {
      property: {
        select: {
          name: true,
          slug: true,
        },
      },
      rentalStatement: {
        select: {
          periodStart: true,
          periodEnd: true,
        },
      },
    },
    orderBy: {
      declaredAt: "asc",
    },
    take: 50,
  });

  // Serialize Decimal fields to prevent passing Decimal objects to client components
  const serializedDistributions = upcomingDistributions.map((dist) => ({
    ...dist,
    totalDistributed: Number(dist.totalDistributed),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/distributions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Distribution Schedule</h1>
          <p className="text-muted-foreground">
            View and manage scheduled distributions
          </p>
        </div>
      </div>

      <ScheduledDistributionsList distributions={serializedDistributions} />
    </div>
  );
}

