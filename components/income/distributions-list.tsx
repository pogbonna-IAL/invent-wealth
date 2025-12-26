"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";

interface MonthlyDistribution {
  month: string;
  payouts: {
    id: string;
    amount: number;
    status: string;
    property: {
      name: string;
      slug: string;
    };
    rentalStatement: {
      periodStart: Date | string;
      periodEnd: Date | string;
    };
  }[];
  totalAmount: number;
}

interface DistributionsListProps {
  distributions: MonthlyDistribution[];
}

export function DistributionsList({ distributions }: DistributionsListProps) {
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
      {distributions.map((month) => (
        <Card key={month.month} className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {format(new Date(month.month + "-01"), "MMMM yyyy")}
                </CardTitle>
                <CardDescription className="mt-1">
                  {month.payouts.length} {month.payouts.length === 1 ? "distribution" : "distributions"} received
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrencyNGN(month.totalAmount, "NGN")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {month.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-base">{payout.property.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rental period: {format(new Date(payout.rentalStatement.periodStart), "MMM d")} -{" "}
                      {format(new Date(payout.rentalStatement.periodEnd), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrencyNGN(Number(payout.amount), "NGN")}
                    </p>
                    <Badge
                      variant={
                        payout.status === "PAID"
                          ? "default"
                          : payout.status === "PENDING"
                          ? "secondary"
                          : "outline"
                      }
                      className="mt-1"
                    >
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

