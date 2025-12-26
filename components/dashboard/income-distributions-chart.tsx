"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { formatCurrencyAxis, formatCurrencyForChart } from "@/lib/utils/currency";

const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

interface IncomeDistributionsChartProps {
  data: { date: string; amount: number }[];
}

export function IncomeDistributionsChart({ data }: IncomeDistributionsChartProps) {
  const formattedData = useMemo(() => data.map((item) => ({
    date: new Date(item.date + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    amount: Number(item.amount.toFixed(2)),
  })), [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          formatter={(value: any) => [formatCurrencyForChart(typeof value === 'number' ? value : 0, "USD"), "Income"]}
        />
        <Legend />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
