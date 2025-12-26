import { PropertyService } from "@/server/services/property.service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, Eye, ExternalLink } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { prisma } from "@/server/db/prisma";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await PropertyService.getPropertyById(id);

  if (!property) {
    notFound();
  }

  // Get property statistics
  const [
    totalInvestments,
    totalInvestors,
    totalInvested,
    confirmedInvestments,
    rentalStatements,
    distributions,
  ] = await Promise.all([
    prisma.investment.count({
      where: { propertyId: property.id },
    }),
    prisma.investment.groupBy({
      by: ["userId"],
      where: {
        propertyId: property.id,
        status: "CONFIRMED",
      },
    }),
    prisma.investment.aggregate({
      where: {
        propertyId: property.id,
        status: "CONFIRMED",
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.investment.findMany({
      where: {
        propertyId: property.id,
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    prisma.rentalStatement.findMany({
      where: { propertyId: property.id },
      orderBy: { periodStart: "desc" },
      take: 5,
    }),
    prisma.distribution.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const investedShares = property.totalShares - property.availableShares;
  const fundingPercentage = (investedShares / property.totalShares) * 100;
  const uniqueInvestors = totalInvestors.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
            <p className="text-muted-foreground">
              {property.addressShort}, {property.city}, {property.country}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/properties/${property.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Property
            </Button>
          </Link>
          <Link href={`/properties/${property.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Public Page
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Property Image */}
      {property.coverImage && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={property.coverImage}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invested"
          description="Confirmed investments"
          value={formatCurrencyNGN(Number(totalInvested._sum.totalAmount || 0), "NGN")}
        />
        <StatCard
          title="Funding Progress"
          description="Shares sold"
          value={`${fundingPercentage.toFixed(1)}%`}
        />
        <StatCard
          title="Total Investors"
          description="Unique investors"
          value={uniqueInvestors.toString()}
        />
        <StatCard
          title="Total Investments"
          description="All investment transactions"
          value={totalInvestments.toString()}
        />
      </div>

      {/* Property Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="statements">Rental Statements</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      property.status === "OPEN"
                        ? "default"
                        : property.status === "FUNDED"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {property.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-semibold">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shortlet Model</p>
                  <p className="font-semibold">{property.shortletModel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{property.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Shares</p>
                  <p className="font-semibold">{property.totalShares.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Shares</p>
                  <p className="font-semibold">{property.availableShares.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invested Shares</p>
                  <p className="font-semibold">{investedShares.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per Share</p>
                  <p className="font-semibold">
                    {formatCurrencyNGN(Number(property.pricePerShare), "NGN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Investment</p>
                  <p className="font-semibold">
                    {property.minShares.toLocaleString()} shares ({formatCurrencyNGN(
                      property.minShares * Number(property.pricePerShare)
                    )})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Projected Annual Yield</p>
                  <p className="font-semibold">
                    {Number(property.projectedAnnualYieldPct).toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Investments</CardTitle>
              <CardDescription>
                Latest confirmed investments for this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedInvestments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No investments yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedInvestments.map((investment) => (
                      <TableRow key={investment.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {investment.user.name || investment.user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {investment.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{investment.shares.toLocaleString()}</TableCell>
                        <TableCell>
                          {formatCurrencyNGN(Number(investment.totalAmount), "NGN")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(investment.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rental Statements Tab */}
        <TabsContent value="statements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Statements</CardTitle>
              <CardDescription>Monthly rental income statements</CardDescription>
            </CardHeader>
            <CardContent>
              {rentalStatements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No rental statements yet
                </p>
              ) : (
                <div className="space-y-4">
                  {rentalStatements.map((statement) => (
                    <Card key={statement.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold">
                              {format(new Date(statement.periodStart), "MMMM yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(statement.periodStart), "MMM d")} -{" "}
                              {format(new Date(statement.periodEnd), "MMM d, yyyy")}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {Number(statement.occupancyRatePct).toFixed(1)}% Occupancy
                          </Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Gross Revenue</p>
                            <p className="font-semibold">
                              {formatCurrencyNGN(Number(statement.grossRevenue), "NGN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Operating Costs</p>
                            <p className="font-semibold text-red-600">
                              -{formatCurrencyNGN(Number(statement.operatingCosts), "NGN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Management Fee</p>
                            <p className="font-semibold text-red-600">
                              -{formatCurrencyNGN(Number(statement.managementFee), "NGN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Net Distributable</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrencyNGN(Number(statement.netDistributable), "NGN")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distributions</CardTitle>
              <CardDescription>Income distributions declared for this property</CardDescription>
            </CardHeader>
            <CardContent>
              {distributions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No distributions yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Distributed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell>
                          {format(new Date(distribution.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {formatCurrencyNGN(Number(distribution.totalDistributed), "NGN")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              distribution.status === "PAID"
                                ? "default"
                                : distribution.status === "PENDING_APPROVAL"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {distribution.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

