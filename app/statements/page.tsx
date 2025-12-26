import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { InvestmentService } from "@/server/services/investment.service";
import { DistributionService } from "@/server/services/distribution.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RentalStatementsList } from "@/components/statements/rental-statements-list";
import dynamicImport from "next/dynamic";

import { ChartLoading } from "@/components/ui/chart-loading";

const OccupancyADRChart = dynamicImport(
  () => import("@/components/statements/occupancy-adr-chart").then((mod) => ({ default: mod.OccupancyADRChart })),
  { 
    loading: () => <ChartLoading />,
  }
);

export const dynamic = "force-dynamic";

export default async function StatementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const isOnboardingComplete = await OnboardingService.isOnboardingComplete(
    session.user.id
  );

  if (!isOnboardingComplete) {
    redirect("/onboarding");
  }

  // Get user's properties (properties they have invested in)
  const portfolio = await InvestmentService.getPortfolioSummary(session.user.id);
  const propertyIds = portfolio.holdingsDetails.map((h) => h.property.id);

  // Get rental statements for user's properties
  const allStatements = await Promise.all(
    propertyIds.map(async (propertyId) => {
      const statements = await DistributionService.getPropertyRentalStatements(
        propertyId
      );
      return statements.map((stmt) => ({
        ...stmt,
        property: portfolio.holdingsDetails.find(
          (h) => h.property.id === propertyId
        )?.property,
      }));
    })
  );

  const statements = allStatements.flat().sort((a, b) => {
    return (
      new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    );
  });

  // Parse operatingCostItems helper function
  const parseOperatingCostItems = (items: any): Array<{ description: string; amount: number }> | null => {
    if (!items) return null;
    
    try {
      const parsed = Array.isArray(items) ? items : JSON.parse(items as string);
      if (!Array.isArray(parsed)) return null;
      
      return parsed.filter((item): item is { description: string; amount: number } => 
        typeof item === 'object' && 
        item !== null && 
        'description' in item && 
        'amount' in item &&
        typeof item.description === 'string' &&
        typeof item.amount === 'number'
      );
    } catch {
      return null;
    }
  };

  // Serialize Decimal fields to numbers for client components
  const serializedStatements = statements.map((stmt) => ({
    id: stmt.id,
    propertyId: stmt.propertyId,
    periodStart: stmt.periodStart instanceof Date ? stmt.periodStart.toISOString() : stmt.periodStart,
    periodEnd: stmt.periodEnd instanceof Date ? stmt.periodEnd.toISOString() : stmt.periodEnd,
    grossRevenue: Number(stmt.grossRevenue),
    operatingCosts: Number(stmt.operatingCosts),
    operatingCostItems: parseOperatingCostItems(stmt.operatingCostItems),
    managementFee: Number(stmt.managementFee),
    incomeAdjustment: Number(stmt.incomeAdjustment ?? 0),
    netDistributable: Number(stmt.netDistributable),
    occupancyRatePct: Number(stmt.occupancyRatePct),
    adr: Number(stmt.adr),
    notes: stmt.notes,
    createdAt: stmt.createdAt instanceof Date ? stmt.createdAt.toISOString() : stmt.createdAt,
    updatedAt: stmt.updatedAt instanceof Date ? stmt.updatedAt.toISOString() : stmt.updatedAt,
    property: stmt.property ? {
      id: stmt.property.id,
      name: stmt.property.name,
      slug: stmt.property.slug,
      pricePerShare: Number(stmt.property.pricePerShare),
    } : null,
    distributions: stmt.distributions?.map((dist) => ({
      id: dist.id,
      status: dist.status,
    })),
  }));

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Rental Statements</h1>
          <p className="text-muted-foreground">
            View detailed rental performance and income statements for your properties
          </p>
        </div>

        {statements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No rental statements available yet. Statements will appear here once properties start generating revenue.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Occupancy Rate Trend</CardTitle>
                  <CardDescription>Monthly occupancy percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <OccupancyADRChart
                    statements={serializedStatements}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Average Daily Rate (ADR) Trend</CardTitle>
                  <CardDescription>Monthly ADR</CardDescription>
                </CardHeader>
                <CardContent>
                  <OccupancyADRChart statements={serializedStatements} />
                </CardContent>
              </Card>
            </div>

            {/* Statements List */}
            <RentalStatementsList statements={serializedStatements} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

