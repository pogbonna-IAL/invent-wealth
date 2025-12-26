"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ScheduledDistribution {
  id: string;
  declaredAt: Date | null;
  totalDistributed: number | string;
  status: string;
  property: {
    name: string;
    slug: string;
  };
  rentalStatement: {
    periodStart: Date;
    periodEnd: Date;
  };
}

interface ScheduledDistributionsListProps {
  distributions: ScheduledDistribution[];
}

export function ScheduledDistributionsList({ distributions }: ScheduledDistributionsListProps) {
  if (distributions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No scheduled distributions found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {distributions.map((distribution) => (
        <Card key={distribution.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{distribution.property.name}</h3>
                  <Badge variant={distribution.status === "PAID" ? "default" : "secondary"}>
                    {distribution.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Period: {format(distribution.rentalStatement.periodStart, "MMM d")} -{" "}
                  {format(distribution.rentalStatement.periodEnd, "MMM d, yyyy")}
                </p>
                {distribution.declaredAt && (
                  <p className="text-sm text-muted-foreground">
                    Scheduled: {format(distribution.declaredAt, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">
                  {formatCurrencyNGN(Number(distribution.totalDistributed), "NGN")}
                </p>
                <Link href={`/admin/distributions/${distribution.id}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

