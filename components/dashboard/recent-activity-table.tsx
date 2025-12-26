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

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  reference: string | null;
  createdAt: Date;
}

interface RecentActivityTableProps {
  transactions: Transaction[];
}

export function RecentActivityTable({ transactions }: RecentActivityTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No recent activity
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isInvestment = transaction.type === "INVESTMENT";
            const isPayout = transaction.type === "PAYOUT";

            return (
              <TableRow key={transaction.id}>
                <TableCell className="text-sm">
                  {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isInvestment ? "default" : isPayout ? "secondary" : "outline"}
                  >
                    {transaction.type === "INVESTMENT"
                      ? "Investment"
                      : transaction.type === "PAYOUT"
                      ? "Payout"
                      : transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {transaction.reference || "N/A"}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    isPayout ? "text-green-600 dark:text-green-400" : ""
                  }`}
                >
                  {isPayout ? "+" : "-"}
                  {formatCurrencyNGN(Number(transaction.amount), transaction.currency || "NGN")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

