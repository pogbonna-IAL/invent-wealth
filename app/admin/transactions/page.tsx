import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { AdminTransactionsTable } from "@/components/admin/transactions/admin-transactions-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    userId?: string;
  }>;
}) {
  const params = await searchParams;

  // Build filters
  const where: any = {};
  
  if (params.type) {
    where.type = params.type;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.createdAt.lte = new Date(params.endDate);
    }
  }

  if (params.minAmount !== undefined || params.maxAmount !== undefined) {
    where.amount = {};
    if (params.minAmount) {
      where.amount.gte = Number(params.minAmount);
    }
    if (params.maxAmount) {
      where.amount.lte = Number(params.maxAmount);
    }
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  // Get transactions with user info
  const transactions = await prisma.transaction.findMany({
    where,
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
    take: 100,
  });

  // Get summary statistics
  const [
    totalTransactions,
    totalInvested,
    totalReceived,
    investmentCount,
    payoutCount,
  ] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where: { ...where, type: "INVESTMENT" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "PAYOUT" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { ...where, type: "INVESTMENT" } }),
    prisma.transaction.count({ where: { ...where, type: "PAYOUT" } }),
  ]);

  // Serialize Decimal fields
  const serializedTransactions = transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">All Transactions</h1>
          <p className="text-muted-foreground">
            View and filter all user transactions across the platform
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Transactions"
          description="All transactions"
          value={totalTransactions.toString()}
        />
        <StatCard
          title="Total Invested"
          description="All investments"
          value={formatCurrencyNGN(Number(totalInvested._sum.amount || 0), "NGN")}
        />
        <StatCard
          title="Total Received"
          description="All payouts"
          value={formatCurrencyNGN(Number(totalReceived._sum.amount || 0), "NGN")}
          className="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Investment Count"
          description="Investment transactions"
          value={investmentCount.toString()}
        />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {serializedTransactions.length} {serializedTransactions.length === 1 ? "transaction" : "transactions"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTransactionsTable transactions={serializedTransactions} currentFilters={params} />
        </CardContent>
      </Card>
    </div>
  );
}

