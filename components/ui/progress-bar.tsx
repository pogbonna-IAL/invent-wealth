import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = true,
  className,
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const heightClass = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }[size];

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (label || percentage !== undefined) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
        </div>
      )}
      <Progress value={percentage} className={cn(heightClass)} />
    </div>
  );
}

