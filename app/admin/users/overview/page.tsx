import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminUsersOverviewPage() {
  // Get all users with their investments and payouts
  const users = await prisma.user.findMany({
    where: {
      role: "INVESTOR",
    },
    include: {
      investments: {
        where: {
          status: "CONFIRMED",
        },
        include: {
          property: {
            select: {
              name: true,
            },
          },
        },
      },
      payouts: {
        include: {
          property: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          investments: true,
          payouts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate aggregated statistics
  const totalUsers = users.length;
  const activeInvestors = users.filter(
    (user) => user.investments.length > 0
  ).length;

  const totalInvested = users.reduce((sum, user) => {
    return (
      sum +
      user.investments.reduce(
        (userSum, inv) => userSum + Number(inv.totalAmount),
        0
      )
    );
  }, 0);

  const totalIncomeReceived = users.reduce((sum, user) => {
    return (
      sum +
      user.payouts.reduce(
        (userSum, payout) => userSum + Number(payout.amount),
        0
      )
    );
  }, 0);

  const totalInvestments = users.reduce(
    (sum, user) => sum + user.investments.length,
    0
  );

  const totalPayouts = users.reduce(
    (sum, user) => sum + user.payouts.length,
    0
  );

  // Top investors by investment amount
  const topInvestors = users
    .map((user) => {
      const invested = user.investments.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );
      return {
        user,
        invested,
      };
    })
    .sort((a, b) => b.invested - a.invested)
    .slice(0, 10);

  // Top earners by income received
  const topEarners = users
    .map((user) => {
      const income = user.payouts.reduce(
        (sum, payout) => sum + Number(payout.amount),
        0
      );
      return {
        user,
        income,
      };
    })
    .sort((a, b) => b.income - a.income)
    .slice(0, 10);

  // Users by registration date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = users.filter(
    (user) => user.createdAt >= thirtyDaysAgo
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">User Overview</h1>
          <p className="text-muted-foreground">
            Aggregated statistics and insights across all users
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          description="All registered investors"
          value={totalUsers.toString()}
        />
        <StatCard
          title="Active Investors"
          description="Users with investments"
          value={activeInvestors.toString()}
        />
        <StatCard
          title="Total Invested"
          description="Platform-wide investments"
          value={formatCurrencyNGN(totalInvested, "NGN")}
        />
        <StatCard
          title="Total Income Received"
          description="All user payouts"
          value={formatCurrencyNGN(totalIncomeReceived, "NGN")}
          className="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total Investments"
          description="Investment records"
          value={totalInvestments.toString()}
        />
        <StatCard
          title="Total Payouts"
          description="Payout records"
          value={totalPayouts.toString()}
        />
        <StatCard
          title="New Users (30d)"
          description="Registered in last 30 days"
          value={recentUsers.toString()}
        />
        <StatCard
          title="Avg Investment"
          description="Average per user"
          value={
            activeInvestors > 0
              ? formatCurrencyNGN(totalInvested / activeInvestors, "NGN")
              : formatCurrencyNGN(0, "NGN")
          }
        />
      </div>

      {/* Top Investors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Investors</CardTitle>
          <CardDescription>
            Users ranked by total investment amount
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topInvestors.map(({ user, invested }, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-semibold hover:underline"
                    >
                      {user.name || user.email || "Unknown User"}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.investments.length}{" "}
                      {user.investments.length === 1 ? "investment" : "investments"} • Joined{" "}
                      {format(user.createdAt, "MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {formatCurrencyNGN(invested, "NGN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.payouts.length} payouts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Earners */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earners</CardTitle>
          <CardDescription>
            Users ranked by total income received
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topEarners
              .filter(({ income }) => income > 0)
              .map(({ user, income }, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-semibold hover:underline"
                      >
                        {user.name || user.email || "Unknown User"}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.payouts.length}{" "}
                        {user.payouts.length === 1 ? "payout" : "payouts"} •{" "}
                        {user.investments.length} properties
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                      {formatCurrencyNGN(income, "NGN")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.investments.length} investments
                    </p>
                  </div>
                </div>
              ))}
            {topEarners.filter(({ income }) => income > 0).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No payouts have been distributed yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

