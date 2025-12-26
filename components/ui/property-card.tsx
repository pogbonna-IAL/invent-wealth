import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Suspense } from "react";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { getResponsiveSizes, getOptimizedQuality } from "@/lib/utils/image-optimization";

interface PropertyCardProps {
  id: string;
  slug: string;
  name: string;
  addressShort: string;
  city: string;
  country: string;
  coverImage?: string | null;
  pricePerShare: number | string;
  totalShares: number;
  availableShares: number;
  minShares: number;
  status: "OPEN" | "FUNDED" | "CLOSED";
  projectedAnnualYieldPct?: number | string;
  className?: string;
}

export function PropertyCard({
  slug,
  name,
  addressShort,
  city,
  country,
  coverImage,
  pricePerShare,
  totalShares,
  availableShares,
  minShares,
  status,
  projectedAnnualYieldPct,
  className,
}: PropertyCardProps) {
  const investedShares = totalShares - availableShares;
  const fundingPercentage = (investedShares / totalShares) * 100;

  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-shadow duration-200",
        className
      )}
    >
      <Link href={`/properties/${slug}`} className="block">
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes={getResponsiveSizes("propertyCard")}
              quality={getOptimizedQuality("propertyCard", "mobile")}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              variant={
                status === "OPEN"
                  ? "default"
                  : status === "FUNDED"
                    ? "secondary"
                    : "outline"
              }
            >
              {status}
            </Badge>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1">{name}</CardTitle>
          <CardDescription className="line-clamp-1">
            {addressShort}, {city}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price per share</p>
              <p className="text-2xl font-bold">
                {formatCurrencyNGN(Number(pricePerShare), "NGN")}
              </p>
            </div>
            {projectedAnnualYieldPct && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Projected Annual Yield</p>
                <p className="text-xl font-semibold">
                  {Number(projectedAnnualYieldPct).toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Estimate only</p>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Funding progress</p>
              <p className="text-sm font-medium">{fundingPercentage.toFixed(1)}%</p>
            </div>
            <Progress value={fundingPercentage} className="h-2" />
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Start from</p>
            <p className="text-lg font-semibold">{minShares.toLocaleString()} shares</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrencyNGN(Number(pricePerShare) * minShares, "NGN")}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

