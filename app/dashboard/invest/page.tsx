import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { PropertyService } from "@/server/services/property.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import { formatCurrencyNGN } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function InvestPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const isOnboardingComplete = await OnboardingService.isOnboardingComplete(session.user.id);
  const properties = await PropertyService.getProperties("OPEN" as any);

  // Calculate availableShares dynamically for each property
  const { prisma } = await import("@/server/db/prisma");
  const propertiesWithAvailableShares = await Promise.all(
    properties.map(async (property) => {
      // Get total confirmed investments for this property
      const totalInvestedShares = await prisma.investment.aggregate({
        where: {
          propertyId: property.id,
          status: "CONFIRMED",
        },
        _sum: {
          shares: true,
        },
      });
      const investedShares = totalInvestedShares._sum.shares || 0;
      const availableShares = property.totalShares - investedShares;

      return {
        ...property,
        availableShares, // Use dynamically calculated value
        investedShares,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Available Investments</h2>
        <p className="text-muted-foreground">
          Browse properties open for fractional ownership investment
        </p>
      </div>

      {!isOnboardingComplete && <OnboardingBanner />}

      {propertiesWithAvailableShares.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No properties are currently open for investment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {propertiesWithAvailableShares.map((property) => {
            const investedShares = property.investedShares ?? (property.totalShares - property.availableShares);
            const fundingPercentage = (investedShares / property.totalShares) * 100;

            return (
              <Card key={property.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{property.name}</CardTitle>
                    <Badge variant="default">OPEN</Badge>
                  </div>
                  <CardDescription>{property.addressShort}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price per share</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyNGN(Number(property.pricePerShare), "NGN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Funding progress</p>
                    <div className="mt-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm">
                        {fundingPercentage.toFixed(1)}% funded
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Minimum investment</span>
                    <span className="font-semibold">
                      {property.minShares} shares
                    </span>
                  </div>
                  <Link href={`/invest?property=${property.slug}`}>
                    <Button className="w-full">Invest Now</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

