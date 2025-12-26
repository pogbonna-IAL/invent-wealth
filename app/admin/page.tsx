import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutDashboard, TrendingUp, Activity, DollarSign, Receipt, Users } from "lucide-react";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();

  // Calculate date for recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get statistics
  const [
    totalProperties,
    totalUsers,
    totalInvestments,
    totalDistributions,
    openProperties,
    totalInvested,
    totalIncomeDistributed,
    totalTransactions,
    recentTransactions,
    recentInvestments,
    recentPayouts,
    activeUsers,
    activeUsersCount,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.investment.count({ where: { status: "CONFIRMED" } }),
    prisma.distribution.count(),
    prisma.property.count({ where: { status: "OPEN" } }),
    prisma.investment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { totalAmount: true },
    }),
    prisma.payout.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.transaction.count(),
    prisma.transaction.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.investment.findMany({
      where: { status: "CONFIRMED" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payout.findMany({
      where: { status: "PAID" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 5,
    }),
    // Query for active users (users with active sessions OR recent activity)
    prisma.user.findMany({
      where: {
        OR: [
          {
            sessions: {
              some: {
                expires: {
                  gt: new Date(), // Active session
                },
              },
            },
          },
          {
            transactions: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            investments: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        ],
      },
      include: {
        sessions: {
          where: {
            expires: {
              gt: new Date(),
            },
          },
          orderBy: {
            expires: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            investments: true,
            transactions: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),
    // Count of active users
    prisma.user.count({
      where: {
        OR: [
          {
            sessions: {
              some: {
                expires: {
                  gt: new Date(),
                },
              },
            },
          },
          {
            transactions: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
          {
            investments: {
              some: {
                createdAt: {
                  gte: thirtyDaysAgo,
                },
              },
            },
          },
        ],
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage properties, distributions, and view platform statistics
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto shadow-brand hover:shadow-lg transition-all duration-300">
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Management Interface
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          description="All properties"
          value={totalProperties.toString()}
        />
        <StatCard
          title="Open Properties"
          description="Available for investment"
          value={openProperties.toString()}
        />
        <StatCard
          title="Total Investors"
          description="Registered users"
          value={totalUsers.toString()}
        />
        <StatCard
          title="Active Users"
          description="Currently active"
          value={activeUsersCount.toString()}
          className="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Total Investments"
          description="Confirmed investments"
          value={totalInvestments.toString()}
        />
        <StatCard
          title="Total Invested"
          description="Platform-wide"
          value={formatCurrencyNGN(Number(totalInvested._sum.totalAmount || 0), "NGN")}
        />
        <StatCard
          title="Total Income Distributed"
          description="All payouts to investors"
          value={formatCurrencyNGN(Number(totalIncomeDistributed._sum.amount || 0), "NGN")}
          className="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Total Transactions"
          description="All platform transactions"
          value={totalTransactions.toString()}
        />
        <StatCard
          title="Distributions"
          description="Declared distributions"
          value={totalDistributions.toString()}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Manage property listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/properties">
              <Button className="w-full">View All Properties</Button>
            </Link>
            <Link href="/admin/properties/new">
              <Button variant="outline" className="w-full">
                Create New Property
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage investor accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users">
              <Button className="w-full">View All Users</Button>
            </Link>
            <Link href="/admin/users/overview">
              <Button variant="outline" className="w-full">
                User Overview
              </Button>
            </Link>
            <Link href="/admin/users/new">
              <Button variant="outline" className="w-full">
                Create New User
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distributions</CardTitle>
            <CardDescription>Declare and manage distributions (creates payouts)</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/distributions">
              <Button className="w-full">Manage Distributions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investments</CardTitle>
            <CardDescription>View and manage all investments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/investments">
              <Button className="w-full" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                View All Investments
              </Button>
            </Link>
            <Link href="/admin/investments/new">
              <Button variant="outline" className="w-full">
                Create Investment
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>View all user transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/transactions">
              <Button className="w-full" variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View All Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income & Distributions</CardTitle>
            <CardDescription>View income analytics by user and property</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/income">
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View All Income
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Statements</CardTitle>
            <CardDescription>View and manage rental statements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/statements">
              <Button className="w-full" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                View All Statements
              </Button>
            </Link>
            <Link href="/admin/statements/new">
              <Button variant="outline" className="w-full">
                Create Statement
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users
              </CardTitle>
              <CardDescription>
                Users with active sessions or recent activity (last 30 days)
              </CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                View All Users
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active users at the moment</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((user) => {
                const hasActiveSession = user.sessions.length > 0;
                const lastActiveSession = user.sessions[0];
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {user.name || user.email || "Unknown User"}
                        </span>
                        <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                          {user.role}
                        </Badge>
                        {hasActiveSession && (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        {hasActiveSession && lastActiveSession && (
                          <p className="text-xs text-muted-foreground">
                            Session expires: {format(lastActiveSession.expires, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Investments</p>
                          <p className="text-sm font-semibold">{user._count.investments}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Transactions</p>
                          <p className="text-sm font-semibold">{user._count.transactions}</p>
                        </div>
                      </div>
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions, investments, and payouts across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recent Transactions */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={transaction.type === "INVESTMENT" ? "default" : "secondary"}
                          >
                            {transaction.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {transaction.user?.name || transaction.user?.email || "Unknown User"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(transaction.createdAt, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {transaction.type === "INVESTMENT" ? "-" : "+"}
                          {formatCurrencyNGN(Number(transaction.amount), "NGN")}
                        </p>
                        {transaction.reference && (
                          <p className="text-xs text-muted-foreground">{transaction.reference}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Investments */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Recent Investments
              </h3>
              <div className="space-y-2">
                {recentInvestments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No investments yet</p>
                ) : (
                  recentInvestments.map((investment) => (
                    <div
                      key={investment.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {investment.user?.name || investment.user?.email || "Unknown User"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {investment.property.name} • {investment.shares.toLocaleString()} shares
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrencyNGN(Number(investment.totalAmount), "NGN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(investment.createdAt, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Payouts */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Payouts
              </h3>
              <div className="space-y-2">
                {recentPayouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payouts yet</p>
                ) : (
                  recentPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {payout.user?.name || payout.user?.email || "Unknown User"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payout.property.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          +{formatCurrencyNGN(Number(payout.amount), "NGN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.paidAt ? format(payout.paidAt, "MMM d, yyyy") : "Pending"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

