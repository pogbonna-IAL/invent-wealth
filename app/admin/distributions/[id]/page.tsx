import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Download, Upload, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { PayoutsTable } from "@/components/admin/distributions/payouts-table";
import { CSVImportButton } from "@/components/admin/distributions/csv-import-button";
import { CSVTemplateButton } from "@/components/admin/distributions/csv-template-button";
import { DistributionApprovalButtons } from "@/components/admin/distributions/distribution-approval-buttons";
import { DeleteDistributionButton } from "@/components/admin/distributions/delete-distribution-button";
import { FixUnderwriterPayoutsButton } from "@/components/admin/distributions/fix-underwriter-payouts-button";

export const dynamic = "force-dynamic";
import { DistributionStatus, PayoutStatus } from "@prisma/client";

export default async function DistributionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const distribution = await prisma.distribution.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      rentalStatement: {
        select: {
          periodStart: true,
          periodEnd: true,
          grossRevenue: true,
          operatingCosts: true,
          managementFee: true,
          netDistributable: true,
          occupancyRatePct: true,
          adr: true,
        },
      },
      payouts: {
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
          createdAt: "asc",
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!distribution) {
    notFound();
  }

  // Serialize distribution Decimal fields for client components
  const serializedDistribution = {
    ...distribution,
    totalDistributed: Number(distribution.totalDistributed),
    declaredAt: distribution.declaredAt ? new Date(distribution.declaredAt) : null,
    approvedAt: distribution.approvedAt ? new Date(distribution.approvedAt) : null,
    createdAt: new Date(distribution.createdAt),
    updatedAt: new Date(distribution.updatedAt),
    rentalStatement: {
      ...distribution.rentalStatement,
      periodStart: new Date(distribution.rentalStatement.periodStart),
      periodEnd: new Date(distribution.rentalStatement.periodEnd),
      grossRevenue: Number(distribution.rentalStatement.grossRevenue),
      operatingCosts: Number(distribution.rentalStatement.operatingCosts),
      managementFee: Number(distribution.rentalStatement.managementFee),
      netDistributable: Number(distribution.rentalStatement.netDistributable),
      occupancyRatePct: Number(distribution.rentalStatement.occupancyRatePct),
      adr: Number(distribution.rentalStatement.adr),
    },
  };

  // Extract serialized values for client components
  const distributionStatus = distribution.status;
  const distributionApprovedBy = distribution.approvedBy || null;
  const distributionApprovedAt = distribution.approvedAt ? new Date(distribution.approvedAt) : null;

  const totalPayouts = distribution.payouts.length;
  const paidPayouts = distribution.payouts.filter((p) => p.status === "PAID").length;
  const pendingPayouts = totalPayouts - paidPayouts;
  const totalPaidAmount = distribution.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Serialize payouts for client component - convert Decimal and Date fields
  const serializedPayouts = distribution.payouts.map((payout) => {
    // Convert Decimal amount to number
    let amount: number;
    if (payout.amount === null || payout.amount === undefined) {
      amount = 0;
    } else if (typeof payout.amount === 'number') {
      amount = payout.amount;
    } else if (typeof payout.amount === 'string') {
      amount = parseFloat(payout.amount) || 0;
    } else {
      // Handle Decimal object - try multiple conversion methods
      const decimalValue = payout.amount as any;
      if (typeof decimalValue.toNumber === 'function') {
        amount = decimalValue.toNumber();
      } else if (typeof decimalValue.toString === 'function') {
        amount = parseFloat(decimalValue.toString()) || 0;
      } else {
        amount = Number(decimalValue) || 0;
      }
    }

    // Create a completely new plain object with no Decimal references
    return {
      id: String(payout.id),
      userId: String(payout.userId),
      propertyId: String(payout.propertyId),
      distributionId: String(payout.distributionId),
      rentalStatementId: String(payout.rentalStatementId),
      sharesAtRecord: Number(payout.sharesAtRecord),
      amount: Number(amount), // Ensure it's a plain number
      status: payout.status as PayoutStatus,
      paidAt: payout.paidAt instanceof Date ? payout.paidAt : (payout.paidAt ? new Date(payout.paidAt) : null),
      paymentMethod: payout.paymentMethod,
      paymentReference: payout.paymentReference,
      bankAccount: payout.bankAccount,
      notes: payout.notes,
      createdAt: payout.createdAt instanceof Date ? payout.createdAt : new Date(payout.createdAt),
      updatedAt: payout.updatedAt instanceof Date ? payout.updatedAt : new Date(payout.updatedAt),
      user: {
        id: String(payout.user.id),
        name: payout.user.name || null,
        email: payout.user.email || null,
      },
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/distributions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2">Distribution Details</h1>
            <p className="text-muted-foreground">
              {distribution.property.name} - {format(distribution.rentalStatement.periodStart, "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DistributionApprovalButtons
            distributionId={distribution.id}
            status={distributionStatus}
            approvedBy={distributionApprovedBy}
            approvedAt={distributionApprovedAt}
          />
          <FixUnderwriterPayoutsButton distributionId={distribution.id} />
          <DeleteDistributionButton
            distributionId={distribution.id}
            canDelete={
              distributionStatus === DistributionStatus.DECLARED &&
              distribution.payouts.every((p) => p.status !== PayoutStatus.PAID)
            }
          />
          <CSVTemplateButton distributionId={distribution.id} />
          <CSVImportButton distributionId={distribution.id} />
        </div>
      </div>

      {/* Distribution Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrencyNGN(serializedDistribution.totalDistributed, "NGN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPayouts}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {paidPayouts} paid, {pendingPayouts} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrencyNGN(totalPaidAmount, "NGN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={distributionStatus === "PAID" ? "default" : "secondary"}
              className="text-base px-3 py-1"
            >
              {distributionStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Rental Statement Info */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Statement Details</CardTitle>
          <CardDescription>
            Period: {format(distribution.rentalStatement.periodStart, "MMM d")} -{" "}
            {format(distribution.rentalStatement.periodEnd, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
              <p className="text-lg font-semibold">
                {formatCurrencyNGN(serializedDistribution.rentalStatement.grossRevenue, "NGN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Operating Costs</p>
              <p className="text-lg font-semibold text-red-600">
                -{formatCurrencyNGN(serializedDistribution.rentalStatement.operatingCosts, "NGN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Management Fee</p>
              <p className="text-lg font-semibold text-red-600">
                -{formatCurrencyNGN(serializedDistribution.rentalStatement.managementFee, "NGN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Distributable</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrencyNGN(serializedDistribution.rentalStatement.netDistributable, "NGN")}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
              <p className="text-lg font-semibold">
                {serializedDistribution.rentalStatement.occupancyRatePct.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Daily Rate (ADR)</p>
              <p className="text-lg font-semibold">
                {formatCurrencyNGN(serializedDistribution.rentalStatement.adr, "NGN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts ({totalPayouts})</CardTitle>
          <CardDescription>
            Manage individual payouts. Update status, amounts, or import from CSV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PayoutsTable payouts={serializedPayouts} distributionId={distribution.id} />
        </CardContent>
      </Card>
    </div>
  );
}

