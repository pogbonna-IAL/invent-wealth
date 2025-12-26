import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { TransactionService } from "@/server/services/transaction.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { AppLayout } from "@/components/layout/app-layout";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrencyNGN } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
  }>;
}) {
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

  const params = await searchParams;
  const filters = {
    type: params.type as any,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    minAmount: params.minAmount ? Number(params.minAmount) : undefined,
    maxAmount: params.maxAmount ? Number(params.maxAmount) : undefined,
  };

  const transactions = await TransactionService.getUserTransactions(
    session.user.id,
    filters
  );
  const summary = await TransactionService.getTransactionSummary(session.user.id);

  // Serialize Decimal fields to numbers for client components
  const serializedTransactions = transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            View all your investment and payout transactions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatCard
            title="Total Invested"
            description="All investments"
            value={formatCurrencyNGN(summary.totalInvested, "NGN")}
          />
          <StatCard
            title="Total Received"
            description="All payouts"
            value={formatCurrencyNGN(summary.totalReceived, "NGN")}
            className="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Investments"
            description="Investment count"
            value={summary.investmentCount.toString()}
          />
          <StatCard
            title="Payouts"
            description="Payout count"
            value={summary.payoutCount.toString()}
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
            <TransactionsTable transactions={serializedTransactions} currentFilters={params} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

