"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import Link from "next/link";

interface Payout {
  id: string;
  amount: number;
  status: string;
  sharesAtRecord: number;
  paidAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  property: {
    id: string;
    name: string;
    slug: string;
  };
  distribution: {
    rentalStatement: {
      periodStart: Date;
      periodEnd: Date;
    };
  };
}

interface AdminIncomeTableProps {
  payouts: Payout[];
}

export function AdminIncomeTable({ payouts }: AdminIncomeTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No payouts found
              </TableCell>
            </TableRow>
          ) : (
            payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>
                  {payout.paidAt
                    ? format(payout.paidAt, "MMM d, yyyy")
                    : format(payout.createdAt, "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/users/${payout.user.id}`}
                    className="font-medium hover:underline"
                  >
                    {payout.user.name || payout.user.email || "Unknown"}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/properties/${payout.property.id}`}
                    className="font-medium hover:underline"
                  >
                    {payout.property.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(payout.distribution.rentalStatement.periodStart, "MMM yyyy")}
                  </span>
                </TableCell>
                <TableCell>{payout.sharesAtRecord.toLocaleString()}</TableCell>
                <TableCell>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrencyNGN(payout.amount, "NGN")}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

