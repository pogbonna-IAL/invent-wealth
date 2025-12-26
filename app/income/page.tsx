import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { DistributionService } from "@/server/services/distribution.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DistributionsList } from "@/components/income/distributions-list";
import { DistributionsByProperty } from "@/components/income/distributions-by-property";
import { HowWeCalculateModal } from "@/components/income/how-we-calculate-modal";
import { formatCurrencyNGN } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
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

  const monthlyDistributions = await DistributionService.getUserMonthlyDistributions(
    session.user.id
  );
  const distributionsByProperty = await DistributionService.getUserDistributionsByProperty(
    session.user.id
  );

  // Serialize Decimal fields to numbers for client components
  const serializedMonthlyDistributions = monthlyDistributions.map((month) => ({
    month: month.month,
    totalAmount: Number(month.totalAmount),
    payouts: (month.payouts || []).map((payout) => ({
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
    })),
  }));

  const serializedDistributionsByProperty = distributionsByProperty.map((propertyDist) => ({
    property: {
      id: propertyDist.property.id,
      name: propertyDist.property.name,
      slug: propertyDist.property.slug,
      totalShares: propertyDist.property.totalShares,
      availableShares: propertyDist.property.availableShares,
    },
    totalAmount: Number(propertyDist.totalAmount),
    payouts: (propertyDist.payouts || []).map((payout) => ({
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
      rentalStatement: {
        id: payout.rentalStatement.id,
        netDistributable: Number(payout.rentalStatement.netDistributable),
        periodStart: payout.rentalStatement.periodStart instanceof Date 
          ? payout.rentalStatement.periodStart.toISOString() 
          : payout.rentalStatement.periodStart,
        periodEnd: payout.rentalStatement.periodEnd instanceof Date 
          ? payout.rentalStatement.periodEnd.toISOString() 
          : payout.rentalStatement.periodEnd,
      },
      distribution: {
        id: payout.distribution.id,
        totalDistributed: Number(payout.distribution.totalDistributed),
      },
    })),
  }));

  // Calculate totals
  const totalIncome = serializedMonthlyDistributions.reduce(
    (sum, month) => sum + month.totalAmount,
    0
  );

  // Calculate total distributions and unique properties
  const totalDistributions = serializedMonthlyDistributions.reduce(
    (sum, month) => sum + (month.payouts?.length || 0),
    0
  );
  const uniqueProperties = new Set(
    serializedMonthlyDistributions.flatMap((month) =>
      (month.payouts || [])
        .map((payout) => payout.property?.id || payout.propertyId)
        .filter(Boolean)
    )
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-rich-xl">Income Earned</h1>
            <p className="text-lg text-muted-rich leading-relaxed font-medium">
              Your monthly rental income distributions timeline
            </p>
          </div>
          <HowWeCalculateModal />
        </div>

        {/* Summary Card - Prominent Income KPI */}
        <Card className="mb-12 border-2 border-accent/20 bg-gradient-to-br from-accent/5 via-background to-primary/5 shadow-brand-lg relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10 pointer-events-none" />
          <CardHeader className="pb-4 relative z-10">
            <CardTitle className="text-lg font-semibold text-foreground/90">Total Income Earned</CardTitle>
            <CardDescription className="text-base">All rental income distributions received to date</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-5xl md:text-6xl text-stat-lg text-accent mb-3">
              {formatCurrencyNGN(totalIncome, "NGN")}
            </p>
            {monthlyDistributions.length > 0 && (
              <p className="text-sm text-muted-rich font-semibold">
                From {totalDistributions} distribution{totalDistributions !== 1 ? 's' : ''} across {uniqueProperties.size} propert{uniqueProperties.size !== 1 ? 'ies' : 'y'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList>
            <TabsTrigger value="monthly">Monthly Timeline</TabsTrigger>
            <TabsTrigger value="property">By Property</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-8">
            <DistributionsList distributions={serializedMonthlyDistributions} />
          </TabsContent>

          <TabsContent value="property" className="mt-8">
            <DistributionsByProperty distributions={serializedDistributionsByProperty} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

