"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { ChevronDown, ChevronUp } from "lucide-react";

interface OperatingCostItem {
  description: string;
  amount: number;
}

interface RentalStatement {
  id: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  grossRevenue: number;
  operatingCosts: number;
  operatingCostItems?: OperatingCostItem[] | null;
  managementFee: number;
  netDistributable: number;
  occupancyRatePct: number;
  adr: number;
  property?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  distributions?: {
    id: string;
    status: string;
  }[];
}

interface RentalStatementsListProps {
  statements: RentalStatement[];
}

export function RentalStatementsList({ statements }: RentalStatementsListProps) {
  // Group by property
  const byProperty = new Map<string, RentalStatement[]>();
  for (const stmt of statements) {
    if (stmt.property) {
      const propertyId = stmt.property.id;
      const existing = byProperty.get(propertyId) || [];
      existing.push(stmt);
      byProperty.set(propertyId, existing);
    }
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Statements</TabsTrigger>
        {Array.from(byProperty.entries()).map(([propertyId, stmts]) => (
          <TabsTrigger key={propertyId} value={propertyId}>
            {stmts[0]?.property?.name || "Unknown"}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all" className="mt-6">
        <div className="space-y-4">
          {statements.map((stmt) => (
            <StatementCard key={stmt.id} statement={stmt} />
          ))}
        </div>
      </TabsContent>

      {Array.from(byProperty.entries()).map(([propertyId, stmts]) => (
        <TabsContent key={propertyId} value={propertyId} className="mt-6">
          <div className="space-y-4">
            {stmts.map((stmt) => (
              <StatementCard key={stmt.id} statement={stmt} />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function StatementCard({ statement }: { statement: RentalStatement }) {
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const periodStart = new Date(statement.periodStart);
  const periodEnd = new Date(statement.periodEnd);
  const grossRevenue = Number(statement.grossRevenue);
  const operatingCosts = Number(statement.operatingCosts);
  const managementFee = Number(statement.managementFee);
  const netDistributable = Number(statement.netDistributable);
  const occupancyRate = Number(statement.occupancyRatePct);
  const adr = Number(statement.adr);

  const hasDistribution = statement.distributions && statement.distributions.length > 0;
  const distributionStatus = hasDistribution && statement.distributions && statement.distributions[0]
    ? statement.distributions[0].status
    : null;

  // Parse operating cost items
  let costItems: OperatingCostItem[] = [];
  if (statement.operatingCostItems) {
    try {
      if (Array.isArray(statement.operatingCostItems)) {
        costItems = statement.operatingCostItems.filter((item): item is OperatingCostItem => 
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
          costItems = parsed.filter((item): item is OperatingCostItem => 
            typeof item === 'object' && 
            item !== null && 
            'description' in item && 
            'amount' in item &&
            typeof item.description === 'string' &&
            typeof item.amount === 'number'
          );
        }
      }
    } catch (e) {
      // If parsing fails, use empty array
      costItems = [];
    }
  }

  const hasCostBreakdown = costItems.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {format(periodStart, "MMMM yyyy")}
              {statement.property && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {statement.property.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {format(periodStart, "MMM d")} - {format(periodEnd, "MMM d, yyyy")}
            </CardDescription>
          </div>
          {distributionStatus && (
            <Badge
              variant={
                distributionStatus === "PAID"
                  ? "default"
                  : distributionStatus === "DECLARED"
                  ? "secondary"
                  : "outline"
              }
            >
              {distributionStatus}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
            <p className="text-lg font-semibold">
              {formatCurrencyNGN(grossRevenue, "NGN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Operating Costs</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{formatCurrencyNGN(operatingCosts, "NGN")}
              </p>
              {hasCostBreakdown && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                >
                  {showCostBreakdown ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {hasCostBreakdown && showCostBreakdown && (
              <div className="mt-2 pt-2 border-t space-y-1">
                {costItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.description}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{formatCurrencyNGN(item.amount, "NGN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Management Fee</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              -{formatCurrencyNGN(managementFee, "NGN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Net Distributable</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrencyNGN(netDistributable, "NGN")}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
            <p className="text-lg font-semibold">{occupancyRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Average Daily Rate (ADR)</p>
            <p className="text-lg font-semibold">
              {formatCurrencyNGN(adr, "NGN")}
            </p>
          </div>
        </div>
        {statement.property && (
          <div className="mt-4 pt-4 border-t">
            <Link href={`/properties/${statement.property.slug}`}>
              <Button variant="outline" size="sm">
                View Property Details
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

