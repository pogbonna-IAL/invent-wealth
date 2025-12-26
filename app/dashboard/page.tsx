import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { InvestmentService } from "@/server/services/investment.service";
import { DistributionService } from "@/server/services/distribution.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import { ChartCard } from "@/components/ui/chart-card";
import dynamicImport from "next/dynamic";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";

import { ChartLoading } from "@/components/ui/chart-loading";

const PortfolioValueChart = dynamicImport(
  () => import("@/components/dashboard/portfolio-value-chart").then((mod) => ({ default: mod.PortfolioValueChart })),
  { 
    loading: () => <ChartLoading />,
  }
);
const IncomeDistributionsChart = dynamicImport(
  () => import("@/components/dashboard/income-distributions-chart").then((mod) => ({ default: mod.IncomeDistributionsChart })),
  { 
    loading: () => <ChartLoading />,
  }
);
const AllocationChart = dynamicImport(
  () => import("@/components/dashboard/allocation-chart").then((mod) => ({ default: mod.AllocationChart })),
  { 
    loading: () => <ChartLoading />,
  }
);
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const isOnboardingComplete = await OnboardingService.isOnboardingComplete(session.user.id);
  const portfolio = await InvestmentService.getPortfolioSummary(session.user.id);
  
  // Get additional data for enhanced dashboard
  const portfolioValueOverTime = await InvestmentService.getPortfolioValueOverTime(session.user.id);
  const incomeDistributionsOverTime = await DistributionService.getIncomeDistributionsOverTime(session.user.id);
  const allocationByCity = await InvestmentService.getPortfolioAllocationByCity(session.user.id);
  const allocationByPropertyType = await InvestmentService.getPortfolioAllocationByPropertyType(session.user.id);
  const nextDistributionDate = await DistributionService.getNextExpectedDistributionDate(session.user.id);
  
  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Serialize Decimal fields to numbers for client components
  const serializedTransactions = recentTransactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));

  // Serialize payouts Decimal fields to numbers
  const serializedPayouts = portfolio.payouts.map((payout) => ({
    id: payout.id,
    userId: payout.userId,
    propertyId: payout.propertyId,
    distributionId: payout.distributionId,
    rentalStatementId: payout.rentalStatementId,
    sharesAtRecord: payout.sharesAtRecord,
    amount: Number(payout.amount),
    status: payout.status,
    paidAt: payout.paidAt instanceof Date ? payout.paidAt.toISOString() : payout.paidAt,
    paymentMethod: payout.paymentMethod,
    paymentReference: payout.paymentReference,
    bankAccount: payout.bankAccount,
    notes: payout.notes,
    createdAt: payout.createdAt instanceof Date ? payout.createdAt.toISOString() : payout.createdAt,
    updatedAt: payout.updatedAt instanceof Date ? payout.updatedAt.toISOString() : payout.updatedAt,
    property: {
      id: payout.property.id,
      name: payout.property.name,
      slug: payout.property.slug,
    },
    rentalStatement: {
      id: payout.rentalStatement.id,
      periodStart: payout.rentalStatement.periodStart instanceof Date 
        ? payout.rentalStatement.periodStart.toISOString() 
        : payout.rentalStatement.periodStart,
      periodEnd: payout.rentalStatement.periodEnd instanceof Date 
        ? payout.rentalStatement.periodEnd.toISOString() 
        : payout.rentalStatement.periodEnd,
    },
  }));

  return (
    <div className="space-y-8">
      {!isOnboardingComplete && <OnboardingBanner />}
      
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-rich-xl">
          {session.user.name ? `${session.user.name}'s Dashboard` : `${session.user.email?.split('@')[0] || 'Your'} Dashboard`}
        </h1>
        <p className="text-muted-rich font-medium">
          Welcome back, {session.user.name || session.user.email?.split('@')[0] || 'there'}!
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Portfolio Value"
          description="Current value of your holdings"
          value={formatCurrencyNGN(portfolio.currentValue, "NGN")}
        />
        <StatCard
          title="Total Invested"
          description="Your total investment amount"
          value={formatCurrencyNGN(portfolio.totalInvested, "NGN")}
        />
        <StatCard
          title="Income Earned"
          description="Total rental income distributions received"
          value={formatCurrencyNGN(portfolio.totalIncome, "NGN")}
          className="border-accent/30 bg-gradient-to-br from-accent/5 to-background"
        />
        <StatCard
          title="Next Distribution"
          description="Expected next payout date"
          value={
            nextDistributionDate
              ? format(nextDistributionDate, "MMM d, yyyy")
              : "N/A"
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Portfolio Value Over Time"
          description="Your portfolio value trend"
        >
          <PortfolioValueChart data={portfolioValueOverTime} />
        </ChartCard>
        <ChartCard
          title="Monthly Income Timeline"
          description="Your rental income distributions by month"
        >
          <IncomeDistributionsChart data={incomeDistributionsOverTime} />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Allocation by City"
          description="Portfolio distribution by location"
        >
          <AllocationChart data={allocationByCity} title="City" />
        </ChartCard>
        <ChartCard
          title="Allocation by Property Type"
          description="Portfolio distribution by property type"
        >
          <AllocationChart data={allocationByPropertyType} title="Property Type" />
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest transactions and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivityTable transactions={serializedTransactions} />
        </CardContent>
      </Card>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
          <CardDescription>Properties you own shares in</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.holdingsDetails.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">
                You don't have any holdings yet.
              </p>
              <Link href="/dashboard/invest">
                <Button>Start Investing</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.holdingsDetails.map((holding) => (
                <div
                  key={holding.property.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-semibold">{holding.property.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {holding.totalShares.toLocaleString()} shares @ {formatCurrencyNGN(Number(holding.property.pricePerShare), "NGN")} per share
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrencyNGN(
                        holding.totalShares * Number(holding.property.pricePerShare),
                        "NGN"
                      )}
                    </p>
                    <Link href={`/properties/${holding.property.slug}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      {serializedPayouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payouts</CardTitle>
            <CardDescription>Latest income distributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serializedPayouts.slice(0, 5).map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-semibold">{payout.property.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrencyNGN(payout.amount, "NGN")}
                    </p>
                    <Badge variant="outline">{payout.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

