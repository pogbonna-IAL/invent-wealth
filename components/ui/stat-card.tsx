import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  description?: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  description,
  value,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden group", className)}>
      {/* Subtle gradient accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-accent/5 transition-all duration-300 pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-semibold text-foreground/90">{title}</CardTitle>
        {icon && <div className="text-primary opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl md:text-3xl text-stat text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-rich mt-2 leading-relaxed font-medium">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-3">
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded",
                trend.isPositive 
                  ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30" 
                  : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

