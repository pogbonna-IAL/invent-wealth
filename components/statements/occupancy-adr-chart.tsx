"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { formatCurrencyAxis } from "@/lib/utils/currency";

const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

interface OccupancyADRChartProps {
  statements: Array<{
    periodStart: Date | string;
    occupancyRatePct: number | string;
    adr: number | string;
  }>;
}

export function OccupancyADRChart({ statements }: OccupancyADRChartProps) {
  const chartData = useMemo(() => {
    if (!statements || !Array.isArray(statements)) {
      return [];
    }
    return statements.map((statement) => ({
      period: new Date(statement.periodStart).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      occupancyRate: Number(statement.occupancyRatePct),
      adr: Number(statement.adr),
    }));
  }, [statements]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="period"
          className="text-xs"
          tick={{ fill: "currentColor" }}
          stroke="currentColor"
        />
        <YAxis
          yAxisId="left"
          className="text-xs"
          tick={{ fill: "currentColor" }}
          stroke="currentColor"
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          className="text-xs"
          tick={{ fill: "currentColor" }}
          stroke="currentColor"
          tickFormatter={(value) => formatCurrencyAxis(value, "USD")}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="occupancyRate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Occupancy Rate (%)"
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="adr"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          name="ADR ($)"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
