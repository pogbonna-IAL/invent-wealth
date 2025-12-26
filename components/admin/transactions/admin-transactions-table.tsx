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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import Link from "next/link";
import { deleteTransaction, bulkDeleteTransactions } from "@/app/actions/admin/transactions";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  reference: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface AdminTransactionsTableProps {
  transactions: Transaction[];
  currentFilters: {
    type?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    userId?: string;
  };
}

export function AdminTransactionsTable({
  transactions,
  currentFilters,
}: AdminTransactionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    type: currentFilters.type || "",
    startDate: currentFilters.startDate || "",
    endDate: currentFilters.endDate || "",
    minAmount: currentFilters.minAmount || "",
    maxAmount: currentFilters.maxAmount || "",
    userId: currentFilters.userId || "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.minAmount) params.set("minAmount", filters.minAmount);
    if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
    if (filters.userId) params.set("userId", filters.userId);
    router.push(`/admin/transactions?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      userId: "",
    });
    router.push("/admin/transactions");
  };

  const hasActiveFilters = Object.values(currentFilters).some((v) => v);

  const handleDelete = async (transactionId: string) => {
    setDeletingId(transactionId);
    try {
      const result = await deleteTransaction({ transactionId });
      if (result.success) {
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to delete transaction");
      }
    } catch (error) {
      alert("An error occurred while deleting transaction");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one transaction");
      return;
    }

    setIsBulkDeleting(true);
    try {
      const result = await bulkDeleteTransactions({
        transactionIds: Array.from(selectedIds),
      });

      if (result.success && "deletedCount" in result) {
        alert(`Successfully deleted ${result.deletedCount} transaction(s)`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to delete transactions");
      }
    } catch (error) {
      alert("An error occurred while deleting transactions");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? "" : value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="All types" />
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
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="0"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Apply Filters</Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            {selectedIds.size} transaction(s) selected
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isBulkDeleting}>
                {isBulkDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedIds.size} Transaction(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedIds.size} selected transaction(s)? 
                  This action cannot be undone and will permanently remove these transactions from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const isSelected = selectedIds.has(transaction.id);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(transaction.id)}
                        disabled={deletingId === transaction.id}
                      />
                    </TableCell>
                    <TableCell>
                      {format(transaction.createdAt, "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${transaction.user.id}`}
                        className="font-medium hover:underline"
                      >
                        {transaction.user.name || transaction.user.email || "Unknown"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === "INVESTMENT" ? "default" : "secondary"}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          transaction.type === "INVESTMENT"
                            ? "font-semibold"
                            : "font-semibold text-green-600 dark:text-green-400"
                        }
                      >
                        {transaction.type === "INVESTMENT" ? "-" : "+"}
                        {formatCurrencyNGN(transaction.amount, "NGN")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {transaction.reference || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingId === transaction.id}
                          >
                            {deletingId === transaction.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction? This action cannot be undone.
                              <br />
                              <br />
                              <strong>Transaction Details:</strong>
                              <br />
                              Type: {transaction.type}
                              <br />
                              Amount: {formatCurrencyNGN(transaction.amount, "NGN")}
                              <br />
                              User: {transaction.user.name || transaction.user.email || "Unknown"}
                              <br />
                              Date: {format(transaction.createdAt, "MMM d, yyyy 'at' h:mm a")}
                              {transaction.reference && (
                                <>
                                  <br />
                                  Reference: {transaction.reference}
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deletingId === transaction.id}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              disabled={deletingId === transaction.id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === transaction.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

