"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { formatCurrencyAxis, formatCurrencyForChart } from "@/lib/utils/currency";

const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

interface PortfolioValueChartProps {
  data: { date: string; value: number }[];
}

export function PortfolioValueChart({ data }: PortfolioValueChartProps) {
  const formattedData = useMemo(() => data.map((item) => ({
    date: new Date(item.date + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    value: Number(item.value.toFixed(2)),
  })), [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "currentColor" }}
          stroke="currentColor"
        />
        <YAxis
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
          formatter={(value: any) => [formatCurrencyForChart(typeof value === 'number' ? value : 0, "USD"), "Value"]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
