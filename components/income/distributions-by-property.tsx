"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrencyNGN } from "@/lib/utils/currency";

interface PropertyDistribution {
  property: {
    id: string;
    name: string;
    slug: string;
    totalShares: number;
    availableShares: number;
  };
  payouts: {
    id: string;
    amount: number;
    status: string;
    sharesAtRecord: number;
    rentalStatement: {
      periodStart: Date | string;
      periodEnd: Date | string;
      netDistributable: number;
    };
    distribution: {
      totalDistributed: number;
    };
  }[];
  totalAmount: number;
}

interface DistributionsByPropertyProps {
  distributions: PropertyDistribution[];
}

export function DistributionsByProperty({
  distributions,
}: DistributionsByPropertyProps) {
  if (distributions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No distributions received yet. Income will appear here once properties start generating rental revenue.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {distributions.map((propertyDist) => (
        <Card key={propertyDist.property.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{propertyDist.property.name}</CardTitle>
                <CardDescription>
                  {propertyDist.payouts.length}{" "}
                  {propertyDist.payouts.length === 1 ? "distribution" : "distributions"} received
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrencyNGN(propertyDist.totalAmount, "NGN")}
                </p>
                <Link href={`/properties/${propertyDist.property.slug}`}>
                  <Button variant="ghost" size="sm" className="mt-2">
                    View Property
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propertyDist.payouts.map((payout) => {
                const periodStart = new Date(payout.rentalStatement.periodStart);
                const periodEnd = new Date(payout.rentalStatement.periodEnd);
                const netDistributable = Number(payout.rentalStatement.netDistributable);
                const totalDistributed = Number(payout.distribution.totalDistributed);
                // Calculate total outstanding shares at time of distribution
                const totalOutstandingShares = propertyDist.property.totalShares - propertyDist.property.availableShares;
                const userSharePercentage = totalOutstandingShares > 0 
                  ? (payout.sharesAtRecord / totalOutstandingShares) * 100 
                  : 0;

                return (
                  <div
                    key={payout.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {format(periodStart, "MMMM yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(periodStart, "MMM d")} - {format(periodEnd, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          payout.status === "PAID"
                            ? "default"
                            : payout.status === "PENDING"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Shares</p>
                        <p className="font-semibold">{payout.sharesAtRecord.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your Payout</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrencyNGN(Number(payout.amount), "NGN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Distributed</p>
                        <p className="font-semibold">
                          {formatCurrencyNGN(netDistributable, "NGN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your Share %</p>
                        <p className="font-semibold">
                          {userSharePercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

