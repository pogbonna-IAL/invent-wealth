"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
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

interface TransactionsTableProps {
  transactions: Transaction[];
  currentFilters: {
    type?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
  };
}

export function TransactionsTable({
  transactions,
  currentFilters,
}: TransactionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [type, setType] = useState(currentFilters.type || "");
  const [startDate, setStartDate] = useState(currentFilters.startDate || "");
  const [endDate, setEndDate] = useState(currentFilters.endDate || "");
  const [minAmount, setMinAmount] = useState(currentFilters.minAmount || "");
  const [maxAmount, setMaxAmount] = useState(currentFilters.maxAmount || "");

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/transactions?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({ [key]: value });
  };

  const clearFilters = () => {
    router.push("/transactions");
  };

  const hasActiveFilters =
    type || startDate || endDate || minAmount || maxAmount;

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No transactions found matching your filters.</p>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type || "all"}
                onValueChange={(value) => {
                  setType(value === "all" ? "" : value);
                  handleFilterChange("type", value === "all" ? "" : value);
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INVESTMENT">Investment</SelectItem>
                  <SelectItem value="PAYOUT">Payout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => handleFilterChange("startDate", startDate)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={() => handleFilterChange("endDate", endDate)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount (₦)</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                onBlur={() => handleFilterChange("minAmount", minAmount)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount (₦)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="Any"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                onBlur={() => handleFilterChange("maxAmount", maxAmount)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
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
              const isPayout = transaction.type === "PAYOUT";
              const isInvestment = transaction.type === "INVESTMENT";

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                    <br />
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(transaction.createdAt), "h:mm a")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        isInvestment
                          ? "default"
                          : isPayout
                          ? "secondary"
                          : "outline"
                      }
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
    </div>
  );
}

