import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MultiPropertyDistributionChart } from "@/components/admin/distributions/multi-property-distribution-chart";

export const dynamic = "force-dynamic";

export default async function MultiPropertyDistributionDashboard() {
  // Get all distributions grouped by property
  const distributions = await prisma.distribution.findMany({
    include: {
      property: {
        select: {
          id: true,
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
      payouts: {
        select: {
          id: true,
          status: true,
          amount: true,
        },
      },
    },
    orderBy: {
      declaredAt: "desc",
    },
    take: 100,
  });

  // Calculate statistics
  const totalDistributed = distributions.reduce(
    (sum, d) => sum + Number(d.totalDistributed),
    0
  );

  const totalPayouts = distributions.reduce((sum, d) => sum + d.payouts.length, 0);
  const paidPayouts = distributions.reduce(
    (sum, d) => sum + d.payouts.filter((p) => p.status === "PAID").length,
    0
  );

  const totalPaidAmount = distributions.reduce((sum, d) => {
    return (
      sum +
      d.payouts
        .filter((p) => p.status === "PAID")
        .reduce((pSum, p) => pSum + Number(p.amount), 0)
    );
  }, 0);

  // Group by property
  const byProperty = distributions.reduce((acc, dist) => {
    const propertyId = dist.propertyId;
    if (!acc[propertyId]) {
      acc[propertyId] = {
        property: dist.property,
        distributions: [],
        totalDistributed: 0,
        totalPayouts: 0,
        paidPayouts: 0,
        totalPaid: 0,
      };
    }
    acc[propertyId].distributions.push(dist);
    acc[propertyId].totalDistributed += Number(dist.totalDistributed);
    acc[propertyId].totalPayouts += dist.payouts.length;
    acc[propertyId].paidPayouts += dist.payouts.filter((p) => p.status === "PAID").length;
    acc[propertyId].totalPaid += dist.payouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return acc;
  }, {} as Record<string, { property: typeof distributions[0]["property"]; distributions: typeof distributions; totalDistributed: number; totalPayouts: number; paidPayouts: number; totalPaid: number }>);

  // Group by month
  const byMonth = distributions.reduce((acc, dist) => {
    if (!dist.declaredAt) return acc;
    const monthKey = format(dist.declaredAt, "yyyy-MM");
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        distributions: [],
        totalDistributed: 0,
        totalPayouts: 0,
      };
    }
    acc[monthKey].distributions.push(dist);
    acc[monthKey].totalDistributed += Number(dist.totalDistributed);
    acc[monthKey].totalPayouts += dist.payouts.length;
    return acc;
  }, {} as Record<string, { month: string; distributions: typeof distributions; totalDistributed: number; totalPayouts: number }>);

  // Serialize distributions for client component (MultiPropertyDistributionChart)
  const serializedDistributions = distributions.map((dist) => ({
    ...dist,
    totalDistributed: Number(dist.totalDistributed),
    payouts: dist.payouts.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
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
          <h1 className="text-3xl font-bold mb-2">Multi-Property Distribution Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of distributions across all properties
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Distributed"
          description="Across all properties"
          value={formatCurrencyNGN(totalDistributed, "NGN")}
        />
        <StatCard
          title="Total Payouts"
          description="All payout records"
          value={totalPayouts.toString()}
        />
        <StatCard
          title="Paid Payouts"
          description="Completed payouts"
          value={paidPayouts.toString()}
        />
        <StatCard
          title="Total Paid"
          description="Amount paid to investors"
          value={formatCurrencyNGN(totalPaidAmount, "NGN")}
          className="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Trends</CardTitle>
          <CardDescription>Distributions over time by property</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiPropertyDistributionChart distributions={serializedDistributions} />
        </CardContent>
      </Card>

      {/* By Property */}
      <Card>
        <CardHeader>
          <CardTitle>Distributions by Property</CardTitle>
          <CardDescription>
            {Object.keys(byProperty).length} properties with distributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(byProperty)
              .sort((a, b) => b.totalDistributed - a.totalDistributed)
              .map((propertyData) => (
                <div
                  key={propertyData.property.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <Link
                      href={`/admin/properties/${propertyData.property.id}`}
                      className="font-semibold hover:underline"
                    >
                      {propertyData.property.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {propertyData.distributions.length}{" "}
                      {propertyData.distributions.length === 1 ? "distribution" : "distributions"} •{" "}
                      {propertyData.totalPayouts} payouts ({propertyData.paidPayouts} paid)
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-lg">
                      {formatCurrencyNGN(propertyData.totalDistributed, "NGN")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid: {formatCurrencyNGN(propertyData.totalPaid, "NGN")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* By Month */}
      <Card>
        <CardHeader>
          <CardTitle>Distributions by Month</CardTitle>
          <CardDescription>Monthly distribution summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(byMonth)
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((monthData) => (
                <div
                  key={monthData.month}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {format(new Date(monthData.month + "-01"), "MMMM yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {monthData.distributions.length}{" "}
                      {monthData.distributions.length === 1 ? "distribution" : "distributions"} •{" "}
                      {monthData.totalPayouts} payouts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatCurrencyNGN(monthData.totalDistributed, "NGN")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

