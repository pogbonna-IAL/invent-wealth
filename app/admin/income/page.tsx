import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminIncomeTable } from "@/components/admin/income/admin-income-table";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminIncomePage() {
  // Get all payouts with user and property info
  const payouts = await prisma.payout.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      distribution: {
        include: {
          rentalStatement: {
            select: {
              periodStart: true,
              periodEnd: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  // Calculate summary statistics
  const totalIncomeDistributed = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const paidPayouts = payouts.filter((p) => p.status === "PAID");
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING");

  const totalPaid = paidPayouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const totalPending = pendingPayouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  // Group by user
  const incomeByUser = payouts.reduce((acc, payout) => {
    const userId = payout.userId;
    if (!acc[userId]) {
      acc[userId] = {
        user: payout.user,
        payouts: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }
    acc[userId].payouts.push(payout);
    acc[userId].totalAmount += Number(payout.amount);
    if (payout.status === "PAID") {
      acc[userId].paidAmount += Number(payout.amount);
    } else {
      acc[userId].pendingAmount += Number(payout.amount);
    }
    return acc;
  }, {} as Record<string, { user: typeof payouts[0]["user"]; payouts: typeof payouts; totalAmount: number; paidAmount: number; pendingAmount: number }>);

  // Group by property
  const incomeByProperty = payouts.reduce((acc, payout) => {
    const propertyId = payout.propertyId;
    if (!acc[propertyId]) {
      acc[propertyId] = {
        property: payout.property,
        payouts: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }
    acc[propertyId].payouts.push(payout);
    acc[propertyId].totalAmount += Number(payout.amount);
    if (payout.status === "PAID") {
      acc[propertyId].paidAmount += Number(payout.amount);
    } else {
      acc[propertyId].pendingAmount += Number(payout.amount);
    }
    return acc;
  }, {} as Record<string, { property: typeof payouts[0]["property"]; payouts: typeof payouts; totalAmount: number; paidAmount: number; pendingAmount: number }>);

  // Serialize Decimal fields
  const serializedPayouts = payouts.map((payout) => ({
    ...payout,
    amount: Number(payout.amount),
    distribution: {
      ...payout.distribution,
      totalDistributed: Number(payout.distribution.totalDistributed),
      rentalStatement: payout.distribution.rentalStatement,
    },
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">All User Income</h1>
            <p className="text-muted-foreground">
              View income payouts and analytics by user and property (analytics view)
            </p>
          </div>
        </div>
        <Link href="/admin/distributions">
          <Button variant="outline">
            Manage Distributions
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Income Distributed"
          description="All payouts"
          value={formatCurrencyNGN(totalIncomeDistributed, "NGN")}
          className="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Total Paid"
          description="Paid payouts"
          value={formatCurrencyNGN(totalPaid, "NGN")}
          className="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total Pending"
          description="Pending payouts"
          value={formatCurrencyNGN(totalPending, "NGN")}
        />
        <StatCard
          title="Total Payouts"
          description="All payout records"
          value={payouts.length.toString()}
        />
      </div>

      {/* Income by User */}
      <Card>
        <CardHeader>
          <CardTitle>Income by User</CardTitle>
          <CardDescription>
            Total income distributed per user ({Object.keys(incomeByUser).length} users)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(incomeByUser)
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .slice(0, 20)
              .map((userIncome) => (
                <div
                  key={userIncome.user.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <Link
                      href={`/admin/users/${userIncome.user.id}`}
                      className="font-semibold hover:underline"
                    >
                      {userIncome.user.name || userIncome.user.email || "Unknown User"}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userIncome.payouts.length}{" "}
                      {userIncome.payouts.length === 1 ? "payout" : "payouts"}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-lg">
                      {formatCurrencyNGN(userIncome.totalAmount, "NGN")}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="text-green-600 dark:text-green-400">
                        Paid: {formatCurrencyNGN(userIncome.paidAmount, "NGN")}
                      </span>
                      {userIncome.pendingAmount > 0 && (
                        <span>Pending: {formatCurrencyNGN(userIncome.pendingAmount, "NGN")}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Income by Property */}
      <Card>
        <CardHeader>
          <CardTitle>Income by Property</CardTitle>
          <CardDescription>
            Total income distributed per property ({Object.keys(incomeByProperty).length} properties)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(incomeByProperty)
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .map((propertyIncome) => (
                <div
                  key={propertyIncome.property.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <Link
                      href={`/admin/properties/${propertyIncome.property.id}`}
                      className="font-semibold hover:underline"
                    >
                      {propertyIncome.property.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {propertyIncome.payouts.length}{" "}
                      {propertyIncome.payouts.length === 1 ? "payout" : "payouts"}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-lg">
                      {formatCurrencyNGN(propertyIncome.totalAmount, "NGN")}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="text-green-600 dark:text-green-400">
                        Paid: {formatCurrencyNGN(propertyIncome.paidAmount, "NGN")}
                      </span>
                      {propertyIncome.pendingAmount > 0 && (
                        <span>Pending: {formatCurrencyNGN(propertyIncome.pendingAmount, "NGN")}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payouts</CardTitle>
          <CardDescription>
            Detailed payout history ({serializedPayouts.length} payouts)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminIncomeTable payouts={serializedPayouts} />
        </CardContent>
      </Card>
    </div>
  );
}

