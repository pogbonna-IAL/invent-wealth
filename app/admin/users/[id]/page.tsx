import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendPasswordResetButton } from "@/components/admin/users/send-password-reset-button";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      onboarding: true,
      investments: {
        where: { status: "CONFIRMED" },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payouts: {
        include: {
          distribution: {
            include: {
              rentalStatement: {
                include: {
                  property: {
                    select: {
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
              property: {
                select: {
                  name: true,
                },
              },
            },
          },
          property: {
            select: {
              name: true,
              slug: true,
              totalShares: true,
              availableShares: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          investments: true,
          payouts: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Get rental statements for properties user has invested in
  const propertyIds = user.investments.map((inv) => inv.propertyId);
  const rentalStatements = propertyIds.length > 0
    ? await prisma.rentalStatement.findMany({
        where: {
          propertyId: { in: propertyIds },
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          distributions: {
            include: {
              payouts: {
                where: {
                  userId: id,
                },
              },
            },
          },
        },
        orderBy: {
          periodStart: "desc",
        },
      })
    : [];

  if (!user) {
    notFound();
  }

  // Serialize investments to convert Decimal fields to numbers
  const serializedInvestments = user.investments.map((inv) => ({
    id: inv.id,
    userId: inv.userId,
    propertyId: inv.propertyId,
    shares: inv.shares,
    totalAmount: Number(inv.totalAmount),
    pricePerShareAtPurchase: Number(inv.pricePerShareAtPurchase),
    status: inv.status,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    property: inv.property,
  }));

  const totalInvested = serializedInvestments.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );

  const totalReceived = user.payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  // Group payouts by property for income statement
  type PayoutGroup = {
    property: typeof user.payouts[0]['property'];
    payouts: typeof user.payouts;
    totalAmount: number;
  };
  
  const payoutsByProperty = user.payouts.reduce((acc, payout) => {
    const propertyId = payout.propertyId;
    if (!acc[propertyId]) {
      acc[propertyId] = {
        property: payout.property,
        payouts: [],
        totalAmount: 0,
      };
    }
    acc[propertyId].payouts.push(payout);
    acc[propertyId].totalAmount += Number(payout.amount);
    return acc;
  }, {} as Record<string, PayoutGroup>);

  // Group payouts by month for income statement
  type MonthGroup = {
    month: string;
    payouts: typeof user.payouts;
    totalAmount: number;
  };
  
  const payoutsByMonth = user.payouts.reduce((acc, payout) => {
    const month = format(payout.createdAt, "yyyy-MM");
    if (!acc[month]) {
      acc[month] = {
        month,
        payouts: [],
        totalAmount: 0,
      };
    }
    acc[month].payouts.push(payout);
    acc[month].totalAmount += Number(payout.amount);
    return acc;
  }, {} as Record<string, MonthGroup>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">User Details</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SendPasswordResetButton
            userId={user.id}
            userEmail={user.email || ""}
            userName={user.name}
          />
          <Link href={`/admin/users/${user.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </Link>
        </div>
      </div>

      {/* User Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrencyNGN(totalInvested, "NGN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrencyNGN(totalReceived, "NGN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.investments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.payouts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-semibold">{user.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-semibold">{user.email || "N/A"}</p>
            </div>
            {user.profile && (
              <>
                {user.profile.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold">{user.profile.phone}</p>
                  </div>
                )}
                {user.profile.country && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Country</p>
                    <p className="font-semibold">{user.profile.country}</p>
                  </div>
                )}
                {user.profile.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="font-semibold">{user.profile.address}</p>
                  </div>
                )}
                {user.profile.dob && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-semibold">{format(user.profile.dob, "MMM d, yyyy")}</p>
                  </div>
                )}
              </>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Account Created</p>
              <p className="font-semibold">{format(user.createdAt, "MMM d, yyyy")}</p>
            </div>
          </div>

          {/* Onboarding Status */}
          {user.onboarding && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Onboarding Status</p>
                  <Badge variant={user.onboarding.status === "COMPLETED" ? "default" : "secondary"}>
                    {user.onboarding.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">KYC Status</p>
                  <Badge
                    variant={
                      user.onboarding.kycStatus === "APPROVED"
                        ? "default"
                        : user.onboarding.kycStatus === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {user.onboarding.kycStatus}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investments */}
      <Card>
        <CardHeader>
          <CardTitle>Investments</CardTitle>
          <CardDescription>{serializedInvestments.length} confirmed investments</CardDescription>
        </CardHeader>
        <CardContent>
          {serializedInvestments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No investments yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serializedInvestments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <Link
                        href={`/admin/properties/${investment.property.id}`}
                        className="font-semibold hover:underline"
                      >
                        {investment.property.name}
                      </Link>
                    </TableCell>
                    <TableCell>{investment.shares.toLocaleString()}</TableCell>
                    <TableCell>
                      {formatCurrencyNGN(investment.totalAmount, "NGN")}
                    </TableCell>
                    <TableCell>{format(investment.createdAt, "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}/investments/${investment.id}/edit`}>
                        <Button variant="ghost" size="sm" title="Edit Investment">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Income Statement */}
      {user.payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income Statement</CardTitle>
            <CardDescription>Complete income history and breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="by-property">By Property</TabsTrigger>
                <TabsTrigger value="by-month">By Month</TabsTrigger>
                <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="statements">Rental Statements</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                    <p className="text-2xl font-bold">
                      {formatCurrencyNGN(totalReceived, "NGN")}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Payouts</p>
                    <p className="text-2xl font-bold">{user.payouts.length}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Payout</p>
                    <p className="text-2xl font-bold">
                      {user.payouts.length > 0
                        ? formatCurrencyNGN(totalReceived / user.payouts.length, "NGN")
                        : formatCurrencyNGN(0, "NGN")}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="by-property" className="mt-4">
                <div className="space-y-4">
                  {Object.entries(payoutsByProperty).map(([propertyId, propertyDist]) => (
                    <Card key={propertyId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{propertyDist.property.name}</CardTitle>
                            <CardDescription>
                              {propertyDist.payouts.length}{" "}
                              {propertyDist.payouts.length === 1 ? "payout" : "payouts"} received
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrencyNGN(propertyDist.totalAmount, "NGN")}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {propertyDist.payouts.map((payout) => {
                            const periodStart = payout.distribution.rentalStatement.periodStart;
                            const periodEnd = payout.distribution.rentalStatement.periodEnd;
                            const totalOutstandingShares = propertyDist.property.totalShares - propertyDist.property.availableShares;
                            const userSharePercentage = totalOutstandingShares > 0 
                              ? (payout.sharesAtRecord / totalOutstandingShares) * 100 
                              : 0;

                            return (
                              <div
                                key={payout.id}
                                className="border rounded-lg p-4 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">
                                      {format(new Date(periodStart), "MMMM yyyy")}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(periodStart), "MMM d")} - {format(new Date(periodEnd), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={
                                      payout.status === "PAID"
                                        ? "default"
                                        : payout.status === "PENDING"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {payout.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Shares</p>
                                    <p className="font-semibold">{payout.sharesAtRecord.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Payout</p>
                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                      {formatCurrencyNGN(Number(payout.amount), "NGN")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Share %</p>
                                    <p className="font-semibold">
                                      {userSharePercentage.toFixed(2)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-semibold">
                                      {format(payout.createdAt, "MMM d, yyyy")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="by-month" className="mt-4">
                <div className="space-y-4">
                  {Object.values(payoutsByMonth)
                    .sort((a, b) => b.month.localeCompare(a.month))
                    .map((month) => (
                      <Card key={month.month}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>
                                {format(new Date(month.month + "-01"), "MMMM yyyy")}
                              </CardTitle>
                              <CardDescription>
                                {month.payouts.length}{" "}
                                {month.payouts.length === 1 ? "payout" : "payouts"} received
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrencyNGN(month.totalAmount, "NGN")}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {month.payouts.map((payout) => (
                              <div
                                key={payout.id}
                                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold">{payout.property.name}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Rental period: {format(new Date(payout.distribution.rentalStatement.periodStart), "MMM d")} -{" "}
                                    {format(new Date(payout.distribution.rentalStatement.periodEnd), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                    {formatCurrencyNGN(Number(payout.amount), "NGN")}
                                  </p>
                                  <Badge
                                    variant={
                                      payout.status === "PAID"
                                        ? "default"
                                        : payout.status === "PENDING"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="mt-1"
                                  >
                                    {payout.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{format(payout.createdAt, "MMM d, yyyy")}</TableCell>
                        <TableCell>{payout.property.name}</TableCell>
                        <TableCell>
                          {format(new Date(payout.distribution.rentalStatement.periodStart), "MMM yyyy")}
                        </TableCell>
                        <TableCell>{payout.sharesAtRecord.toLocaleString()}</TableCell>
                        <TableCell>
                          {formatCurrencyNGN(Number(payout.amount), "NGN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payout.status === "PAID" ? "default" : "secondary"}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="transactions" className="mt-4">
                <div className="space-y-4">
                  {user.transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No transactions yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(transaction.createdAt, "MMM d, yyyy 'at' h:mm a")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={transaction.type === "INVESTMENT" ? "default" : "secondary"}
                              >
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {transaction.reference || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  transaction.type === "INVESTMENT"
                                    ? "font-semibold"
                                    : "font-semibold text-green-600 dark:text-green-400"
                                }
                              >
                                {transaction.type === "INVESTMENT" ? "-" : "+"}
                                {formatCurrencyNGN(Number(transaction.amount), "NGN")}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="statements" className="mt-4">
                <div className="space-y-4">
                  {rentalStatements.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No rental statements available for this user's properties
                    </p>
                  ) : (
                    rentalStatements.map((statement) => {
                      const userPayout = statement.distributions
                        .flatMap((d) => d.payouts)
                        .find((p) => p.userId === id);

                      return (
                        <Card key={statement.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{statement.property.name}</CardTitle>
                                <CardDescription>
                                  {format(statement.periodStart, "MMM d, yyyy")} -{" "}
                                  {format(statement.periodEnd, "MMM d, yyyy")}
                                </CardDescription>
                              </div>
                              <Link href={`/admin/statements/${statement.id}`}>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
                                <p className="font-semibold">
                                  {formatCurrencyNGN(Number(statement.grossRevenue), "NGN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Operating Costs</p>
                                <p className="font-semibold text-red-600 dark:text-red-400">
                                  -{formatCurrencyNGN(Number(statement.operatingCosts), "NGN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Management Fee</p>
                                <p className="font-semibold text-red-600 dark:text-red-400">
                                  -{formatCurrencyNGN(Number(statement.managementFee), "NGN")}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Net Distributable</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  {formatCurrencyNGN(Number(statement.netDistributable), "NGN")}
                                </p>
                              </div>
                            </div>
                            {userPayout && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Your Payout</p>
                                <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                                  {formatCurrencyNGN(Number(userPayout.amount), "NGN")}
                                </p>
                                <Badge
                                  variant={
                                    userPayout.status === "PAID"
                                      ? "default"
                                      : userPayout.status === "PENDING"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="mt-2"
                                >
                                  {userPayout.status}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

