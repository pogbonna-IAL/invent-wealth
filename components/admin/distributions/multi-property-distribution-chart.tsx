"use client";

import { useMemo } from "react";

interface Distribution {
  id: string;
  propertyId: string;
  totalDistributed: number | string;
  declaredAt: Date | null;
  property: {
    name: string;
  };
}

interface MultiPropertyDistributionChartProps {
  distributions: Distribution[];
}

export function MultiPropertyDistributionChart({ distributions }: MultiPropertyDistributionChartProps) {
  const chartData = useMemo(() => {
    // Group by property and month
    const grouped = distributions.reduce((acc, dist) => {
      if (!dist.declaredAt) return acc;
      const monthKey = new Date(dist.declaredAt).toISOString().slice(0, 7); // YYYY-MM
      const key = `${dist.propertyId}-${monthKey}`;
      if (!acc[key]) {
        acc[key] = {
          property: dist.property.name,
          month: monthKey,
          amount: 0,
        };
      }
      acc[key].amount += Number(dist.totalDistributed);
      return acc;
    }, {} as Record<string, { property: string; month: string; amount: number }>);

    return Object.values(grouped);
  }, [distributions]);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 0);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No distribution data available for chart
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-64 flex items-end gap-2">
        {chartData.slice(0, 20).map((data, index) => (
          <div
            key={index}
            className="flex-1 bg-primary rounded-t hover:bg-primary/80 transition-colors relative group"
            style={{
              height: `${(data.amount / maxAmount) * 100}%`,
              minHeight: "4px",
            }}
            title={`${data.property} - ${data.month}: ₦${data.amount.toLocaleString()}`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {data.property}
              <br />
              {data.month}: ₦{data.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Showing up to 20 data points. Hover over bars for details.
      </div>
    </div>
  );
}

