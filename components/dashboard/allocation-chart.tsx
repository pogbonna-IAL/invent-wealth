"use client";

import dynamic from "next/dynamic";
import { formatCurrencyForChart } from "@/lib/utils/currency";

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

interface AllocationChartProps {
  data: { name: string; value: number }[];
  title: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary)) / 0.8",
  "hsl(var(--primary)) / 0.6",
  "hsl(var(--primary)) / 0.4",
  "hsl(var(--primary)) / 0.2",
];

export function AllocationChart({ data, title }: AllocationChartProps) {
  const formattedData = data.map((item) => ({
    name: item.name,
    value: Number(item.value.toFixed(2)),
  }));

  if (formattedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No allocation data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {formattedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value: any) => formatCurrencyForChart(typeof value === 'number' ? value : 0, "USD")}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
