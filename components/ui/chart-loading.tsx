import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ChartLoading() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </CardContent>
    </Card>
  );
}

