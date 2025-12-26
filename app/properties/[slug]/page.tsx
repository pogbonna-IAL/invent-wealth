import { PropertyService } from "@/server/services/property.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { FXService } from "@/server/services/fx.service";
import { auth } from "@/server/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvestmentForm } from "@/components/investment/investment-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ProductSchema } from "@/components/seo/json-ld";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import { ChartCard } from "@/components/ui/chart-card";
import { ChartLoading } from "@/components/ui/chart-loading";
import dynamicImport from "next/dynamic";

const HistoricalIncomeChart = dynamicImport(
  () => import("@/components/properties/historical-income-chart").then((mod) => ({ default: mod.HistoricalIncomeChart })),
  { 
    loading: () => <ChartLoading />,
  }
);
import { StatCard } from "@/components/ui/stat-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Metadata } from "next";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { SocialShare } from "@/components/marketing/social-share";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await PropertyService.getPropertyBySlug(slug);

  if (!property) {
    return {
      title: "Property Not Found - InventWealth",
    };
  }

  return {
    title: `${property.name} - InventWealth | Property Investment`,
    description: property.description,
    openGraph: {
      title: property.name,
      description: property.description,
      type: "website",
      images: property.coverImage ? [property.coverImage] : [],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const property = await PropertyService.getPropertyBySlug(slug, session?.user?.id || undefined);

  if (!property) {
    notFound();
  }

  // Check onboarding status if user is logged in
  let isOnboardingComplete = false;
  if (session?.user?.id) {
    isOnboardingComplete = await OnboardingService.isOnboardingComplete(session.user.id);
  }

  // Use dynamically calculated availableShares from PropertyService (already calculated)
  const availableShares = property.availableShares ?? (property.totalShares - (property.investedShares || 0));
  const investedShares = property.investedShares ?? (property.totalShares - availableShares);
  const targetRaise = Number(property.pricePerShare) * property.totalShares;

  // Get latest rental statement for occupancy/ADR snapshot
  const latestStatement = property.rentalStatements?.[0] || null;
  // pricePerShare is now stored in NGN, so minInvestmentAmount is already in NGN
  const minInvestmentAmountNGN = property.minShares * Number(property.pricePerShare);

  // Serialize Decimal fields to numbers for client components
  const serializedProperty = {
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: property.targetRaise ? Number(property.targetRaise) : null,
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
    availableShares: availableShares, // Use dynamically calculated value
    investedShares: investedShares, // Use dynamically calculated value
    rentalStatements: property.rentalStatements?.map((stmt) => ({
      ...stmt,
      periodStart: stmt.periodStart instanceof Date ? stmt.periodStart.toISOString() : stmt.periodStart,
      periodEnd: stmt.periodEnd instanceof Date ? stmt.periodEnd.toISOString() : stmt.periodEnd,
      grossRevenue: Number(stmt.grossRevenue),
      operatingCosts: Number(stmt.operatingCosts),
      managementFee: Number(stmt.managementFee),
      incomeAdjustment: Number(stmt.incomeAdjustment ?? 0),
      netDistributable: Number(stmt.netDistributable),
      occupancyRatePct: Number(stmt.occupancyRatePct),
      adr: Number(stmt.adr),
      createdAt: stmt.createdAt instanceof Date ? stmt.createdAt.toISOString() : stmt.createdAt,
      updatedAt: stmt.updatedAt instanceof Date ? stmt.updatedAt.toISOString() : stmt.updatedAt,
      distributions: stmt.distributions?.map((dist) => ({
        id: dist.id,
        status: dist.status,
      })) || [],
    })) || [],
  };

  // Use AppLayout if authenticated, MarketingLayout if not
  const Layout = session ? AppLayout : MarketingLayout;

  return (
    <>
      <ProductSchema
        name={property.name}
        description={property.description}
        price={String(property.pricePerShare)}
        priceCurrency="USD"
        availability={
          property.status === "OPEN"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
        }
        url={`https://inventwealth.com/properties/${property.slug}`}
      />
      <Layout>
        <div className="container mx-auto px-4 py-12">
      {/* Property Gallery */}
      {(() => {
        // Parse gallery from JSON if it's a string, otherwise use as-is
        let galleryArray: string[] = [];
        if (property.gallery) {
          if (typeof property.gallery === 'string') {
            try {
              const parsed = JSON.parse(property.gallery);
              // Validate parsed result is an array of strings
              if (Array.isArray(parsed)) {
                galleryArray = parsed.filter((item): item is string => typeof item === 'string');
              }
            } catch {
              galleryArray = [];
            }
          } else if (Array.isArray(property.gallery)) {
            // Filter to ensure all items are strings and not null
            galleryArray = property.gallery.filter((item): item is string => typeof item === 'string' && item !== null);
          }
        }

        const hasImages = property.coverImage || galleryArray.length > 0;
        
        return hasImages ? (
          <PropertyGallery
            images={galleryArray}
            coverImage={property.coverImage}
            propertyName={property.name}
          />
        ) : (
          <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No images available</p>
          </div>
        );
      })()}

      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <Badge className="mb-4">{property.status}</Badge>
            <h1 className="mb-3 text-4xl font-bold tracking-tight">{property.name}</h1>
            <p className="text-lg text-muted-foreground">{property.addressShort}, {property.city}</p>
          </div>
          <SocialShare 
            url={`https://inventwealth.com/properties/${property.slug}`}
            title={`Check out ${property.name} - Premium Property Investment Opportunity`}
            description={property.description || `Invest in ${property.name} through fractional ownership`}
          />
        </div>
        {property.status === "OPEN" && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Start investing from</p>
            <p className="text-2xl font-semibold">{property.minShares.toLocaleString()} shares</p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrencyNGN(minInvestmentAmountNGN, "NGN")}
            </p>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      {session && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatCard
            title="Shares Available"
            description="Remaining shares for investment"
            value={availableShares.toLocaleString()}
          />
          <StatCard
            title="Price per Share"
            description="Current share price"
            value={formatCurrencyNGN(Number(property.pricePerShare), "NGN")}
          />
          <StatCard
            title="Minimum Investment"
            description="Minimum shares required"
            value={`${property.minShares} shares (${formatCurrencyNGN(minInvestmentAmountNGN, "NGN")})`}
          />
        </div>
      )}

      {/* Transparency Section - Show key metrics */}
      {latestStatement && (
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Performance Transparency</CardTitle>
            <CardDescription>
              Latest period: {new Date(latestStatement.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="text-2xl font-semibold">
                  {formatCurrencyNGN(Number(latestStatement.grossRevenue), "NGN")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Operating Costs</p>
                <p className="text-2xl font-semibold">
                  {formatCurrencyNGN(Number(latestStatement.operatingCosts), "NGN")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Management Fee</p>
                <p className="text-2xl font-semibold">
                  {formatCurrencyNGN(Number(latestStatement.managementFee), "NGN")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Net Distributable</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {formatCurrencyNGN(Number(latestStatement.netDistributable), "NGN")}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-xl font-semibold">
                  {Number(latestStatement.occupancyRatePct).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Daily Rate (ADR)</p>
                <p className="text-xl font-semibold">
                  {formatCurrencyNGN(Number(latestStatement.adr), "NGN")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Fee Percentage</p>
                <p className="text-xl font-semibold">
                  {((Number(latestStatement.managementFee) / Number(latestStatement.grossRevenue)) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{property.description}</p>
              </div>
              {property.highlights && Array.isArray(property.highlights) && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Highlights</p>
                  <ul className="list-disc list-inside space-y-1">
                    {property.highlights
                      .filter((item): item is string => typeof item === 'string')
                      .map((highlight, idx) => (
                        <li key={idx} className="text-sm">{highlight}</li>
                      ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shortlet Model</p>
                  <p className="font-semibold">{property.shortletModel.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">
                    {property.city}, {property.country}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected Annual Yield</p>
                  <p className="font-semibold">{Number(property.projectedAnnualYieldPct).toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Estimate only, not guaranteed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Rental Statements</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!session && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Shares</p>
                        <p className="text-2xl font-bold">
                          {property.totalShares.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price per Share</p>
                        <p className="text-2xl font-bold">
                          {formatCurrencyNGN(Number(property.pricePerShare), "NGN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Minimum Investment</p>
                        <p className="text-xl font-semibold">
                          {property.minShares} shares
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Available Shares</p>
                        <p className="text-xl font-semibold">
                          {availableShares.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Funding Progress</p>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(property.fundingPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm">
                      {investedShares.toLocaleString()} / {property.totalShares.toLocaleString()} shares (
                      {property.fundingPercentage.toFixed(1)}%)
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Target: {formatCurrencyNGN(targetRaise, "NGN")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="income" className="space-y-4">
              {property.rentalStatements.length > 0 && session && (
                <ChartCard
                  title="Historical Income"
                  description="Gross revenue and net distributable income over time"
                >
                  <HistoricalIncomeChart statements={serializedProperty.rentalStatements} />
                </ChartCard>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Rental Statements</CardTitle>
                  <CardDescription>Monthly revenue and distributions</CardDescription>
                </CardHeader>
                <CardContent>
                  {property.rentalStatements.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No rental statements available yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {serializedProperty.rentalStatements.map((stmt) => (
                        <div
                          key={stmt.id}
                          className="border-b pb-4 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">
                                {new Date(stmt.periodStart).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Gross: ${Number(stmt.grossRevenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • 
                                Costs: ${Number(stmt.operatingCosts).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • 
                                Occupancy: {Number(stmt.occupancyRatePct).toFixed(1)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-green-600">
                                ${Number(stmt.netDistributable).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <Badge variant={stmt.distributions?.[0]?.status === "PAID" ? "default" : "secondary"}>
                                {stmt.distributions?.[0]?.status === "PAID" ? "Paid" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Property documents and agreements</CardDescription>
                </CardHeader>
                <CardContent>
                  {property.documents.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      No documents available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {property.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between border-b pb-2 hover:text-primary"
                        >
                          <span>{doc.title}</span>
                          <Badge variant="outline">{doc.docType}</Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {property.status === "OPEN" && session ? (
            <Card>
              <CardHeader>
                <CardTitle>Invest Now</CardTitle>
                <CardDescription>
                  {property.userTotalShares
                    ? `You own ${property.userTotalShares.toLocaleString()} shares`
                    : `Start from ${property.minShares.toLocaleString()} shares`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isOnboardingComplete ? (
                  <div className="space-y-4">
                    <OnboardingBanner />
                    <Link href="/onboarding">
                      <Button className="w-full" size="lg">
                        Complete Profile to Invest
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <InvestmentForm property={serializedProperty} />
                    <Link href={`/invest?property=${property.slug}`}>
                      <Button variant="outline" className="w-full">
                        Use Investment Flow
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : property.status === "OPEN" ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  Sign in to invest in this property
                </p>
                <a href="/auth/signin">
                  <Badge>Sign In</Badge>
                </a>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  This property is {property.status.toLowerCase()} and not
                  accepting new investments.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
      </Layout>
    </>
  );
}

