import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { InvestmentService } from "@/server/services/investment.service";
import { DistributionService } from "@/server/services/distribution.service";
import { WalletService } from "@/server/services/wallet.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { StatCard } from "@/components/ui/stat-card";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const portfolio = await InvestmentService.getPortfolioSummary(session.user.id);
  const payouts = await DistributionService.getUserPayouts(session.user.id);
  const walletBalance = await WalletService.getWalletBalance(session.user.id);
  const walletTransactions = await WalletService.getWalletTransactions(session.user.id);

  // Serialize Decimal fields to numbers for client components
  const serializedPayouts = payouts.map((payout) => ({
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
      <div>
        <h2 className="text-2xl font-bold">Wallet</h2>
        <p className="text-muted-foreground">
          View your wallet balance, transactions, and distributions
        </p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Available balance for future investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            {formatCurrencyNGN(walletBalance, "NGN")}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This balance can be used to make new investments
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="distributions" className="w-full">
        <TabsList>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Income Payouts</CardTitle>
              <CardDescription>
                Monthly distributions from your property investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serializedPayouts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No payouts yet. Start investing to earn passive income.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serializedPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <h3 className="font-semibold">{payout.property.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.rentalStatement.periodStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })} •{" "}
                          {payout.sharesAtRecord.toLocaleString()} shares
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          +{formatCurrencyNGN(payout.amount, "NGN")}
                        </p>
                        <Badge
                          variant={
                            payout.status === "PAID" ? "default" : "secondary"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Transactions</CardTitle>
              <CardDescription>Your wallet transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {walletTransactions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No wallet transactions yet. Payouts marked as "Wallet" will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {tx.type === "PAYOUT" ? "Payout Credit" : "Investment"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}
                          {tx.reference && ` • ${tx.reference}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${tx.type === "PAYOUT" ? "text-green-600 dark:text-green-400" : ""}`}>
                          {tx.type === "PAYOUT" ? "+" : "-"}
                          {formatCurrencyNGN(Number(tx.amount), "NGN")}
                        </p>
                        <Badge variant={tx.type === "PAYOUT" ? "default" : "outline"}>
                          {tx.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

