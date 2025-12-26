import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { DownloadExpensesButton } from "@/components/admin/statements/download-expenses-button";
import { DeclareDistributionButton } from "@/components/admin/statements/declare-distribution-button";

export const dynamic = "force-dynamic";

const OPERATING_COST_CATEGORIES = {
  GENERAL_OPERATIONS: "General Operations Expenses",
  MARKETING: "Marketing Expenses",
  MAINTENANCE: "Maintenance Expenses",
} as const;

export default async function StatementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const statement = await prisma.rentalStatement.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      distributions: {
        select: {
          id: true,
          status: true,
          totalDistributed: true,
        },
      },
    },
  });

  if (!statement) {
    notFound();
  }

  // Parse operating cost items
  let operatingCostItems: Array<{ description: string; amount: number; category?: string; originalAmount?: number; monthlyAmount?: number }> = [];
  if (statement.operatingCostItems) {
    try {
      if (Array.isArray(statement.operatingCostItems)) {
        operatingCostItems = statement.operatingCostItems.filter((item): item is { description: string; amount: number; category?: string; originalAmount?: number; monthlyAmount?: number } => 
          typeof item === 'object' && 
          item !== null && 
          'description' in item && 
          'amount' in item &&
          typeof item.description === 'string' &&
          typeof item.amount === 'number'
        );
      } else if (typeof statement.operatingCostItems === "string") {
        const parsed = JSON.parse(statement.operatingCostItems);
        if (Array.isArray(parsed)) {
          operatingCostItems = parsed;
        }
      }
    } catch (e) {
      // If parsing fails, create a single item from the total
      operatingCostItems = [
        {
          description: "Total Operating Costs",
          amount: Number(statement.operatingCosts),
        },
      ];
    }
  } else {
    // Fallback: create a single item from the total
    operatingCostItems = [
      {
        description: "Total Operating Costs",
        amount: Number(statement.operatingCosts),
      },
    ];
  }

  const hasDistribution = statement.distributions && statement.distributions.length > 0;
  const distribution = hasDistribution && statement.distributions[0] ? {
    ...statement.distributions[0],
    totalDistributed: Number(statement.distributions[0].totalDistributed),
  } : null;

  // Calculate management fee percentage (if we had stored it, otherwise estimate)
  const managementFeePct = Number(statement.grossRevenue) > 0
    ? (Number(statement.managementFee) / Number(statement.grossRevenue)) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/statements">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">Statement Details</h1>
            <p className="text-muted-foreground">
              {statement.property.name} - {format(statement.periodStart, "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/statements/${statement.id}/edit`}>
            <Button variant="outline">
              Edit Statement
            </Button>
          </Link>
          <DownloadExpensesButton
            statementId={statement.id}
            propertyName={statement.property.name}
            periodStart={statement.periodStart}
            periodEnd={statement.periodEnd}
          />
          {!hasDistribution && (
            <DeclareDistributionButton
              propertyId={statement.propertyId}
              rentalStatementId={statement.id}
              propertyName={statement.property.name}
              netDistributable={Number(statement.netDistributable)}
            />
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className={`grid gap-4 ${Number(statement.incomeAdjustment ?? 0) !== 0 ? "md:grid-cols-2 lg:grid-cols-5" : "md:grid-cols-2 lg:grid-cols-4"}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrencyNGN(Number(statement.grossRevenue), "NGN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operating Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{formatCurrencyNGN(Number(statement.operatingCosts), "NGN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Management Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{formatCurrencyNGN(Number(statement.managementFee), "NGN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {managementFeePct.toFixed(1)}% of revenue
            </p>
          </CardContent>
        </Card>
        {Number(statement.incomeAdjustment ?? 0) !== 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Income Adjustment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${Number(statement.incomeAdjustment) > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {Number(statement.incomeAdjustment) > 0 ? "+" : ""}
                {formatCurrencyNGN(Number(statement.incomeAdjustment ?? 0), "NGN")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Post-account preparation adjustment
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Distributable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrencyNGN(Number(statement.netDistributable), "NGN")}
            </p>
            {Number(statement.incomeAdjustment ?? 0) !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Includes {Number(statement.incomeAdjustment) > 0 ? "positive" : "negative"} adjustment
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statement Information */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Information</CardTitle>
          <CardDescription>
            Period: {format(statement.periodStart, "MMM d, yyyy")} - {format(statement.periodEnd, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Link */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Property</p>
            <Link
              href={`/properties/${statement.property.slug}`}
              className="text-lg font-semibold hover:underline"
            >
              {statement.property.name}
            </Link>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
              <p className="text-lg font-semibold">
                {Number(statement.occupancyRatePct).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Daily Rate (ADR)</p>
              <p className="text-lg font-semibold">
                {formatCurrencyNGN(Number(statement.adr), "NGN")}
              </p>
            </div>
          </div>

          {/* Operating Cost Items Breakdown */}
          <div>
            <p className="text-sm font-medium mb-3">Operating Cost Breakdown</p>
            {(() => {
              // Group items by category
              const groupedItems = operatingCostItems.reduce((acc, item) => {
                const category = item.category || "UNCATEGORIZED";
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(item);
                return acc;
              }, {} as Record<string, typeof operatingCostItems>);

              const categoryOrder = [
                "GENERAL_OPERATIONS",
                "MARKETING",
                "MAINTENANCE",
                "UNCATEGORIZED"
              ];

              return (
                <div className="space-y-4">
                  {categoryOrder.map((categoryKey) => {
                    const items = groupedItems[categoryKey];
                    if (!items || items.length === 0) return null;

                    const categoryLabel = OPERATING_COST_CATEGORIES[categoryKey as keyof typeof OPERATING_COST_CATEGORIES] || "Uncategorized";
                    const categoryTotal = items.reduce((sum, item) => sum + item.amount, 0);

                    return (
                      <div key={categoryKey} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">{categoryLabel}</h4>
                          <span className="text-xs font-medium text-muted-foreground">
                            Subtotal: {formatCurrencyNGN(categoryTotal, "NGN")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-background rounded-md"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.description}</p>
                                {item.originalAmount && item.monthlyAmount && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Original: {formatCurrencyNGN(item.originalAmount, "NGN")} • 
                                    Monthly: {formatCurrencyNGN(item.monthlyAmount, "NGN")}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                -{formatCurrencyNGN(item.amount, "NGN")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center p-3 border-t-2 border-foreground/10 mt-2">
                    <p className="font-semibold">Total Operating Costs</p>
                    <p className="font-semibold text-lg text-red-600 dark:text-red-400">
                      -{formatCurrencyNGN(Number(statement.operatingCosts), "NGN")}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Notes */}
          {statement.notes && (
            <div>
              <p className="text-sm font-medium mb-2">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                {statement.notes}
              </p>
            </div>
          )}

          {/* Distribution Status */}
          {hasDistribution && distribution && (
            <div>
              <p className="text-sm font-medium mb-2">Distribution Status</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={distribution.status === "PAID" ? "default" : "secondary"}
                >
                  {distribution.status}
                </Badge>
                <Link href={`/admin/distributions/${distribution.id}`}>
                  <Button variant="outline" size="sm">
                    View Distribution
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div>
            <p className="text-sm text-muted-foreground">
              Created: {format(statement.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

