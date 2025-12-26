"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { X, Trash2, Loader2, Edit, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import Link from "next/link";
import { deleteInvestment } from "@/app/actions/admin/investments";

interface Investment {
  id: string;
  userId: string;
  propertyId: string;
  shares: number;
  totalAmount: number;
  pricePerShareAtPurchase: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    onboarding: {
      kycStatus: string | null;
    } | null;
  };
  property: {
    id: string;
    name: string;
    slug: string;
  };
}

interface AdminInvestmentsTableProps {
  investments: Investment[];
  currentFilters: {
    status?: string;
    userId?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function AdminInvestmentsTable({
  investments,
  currentFilters,
}: AdminInvestmentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    status: currentFilters.status || "",
    userId: currentFilters.userId || "",
    propertyId: currentFilters.propertyId || "",
    startDate: currentFilters.startDate || "",
    endDate: currentFilters.endDate || "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // Identify non-compliant investments
  const isNonCompliant = (investment: Investment): boolean => {
    // Non-compliant if:
    // 1. Status is PENDING or CANCELLED
    // 2. User KYC is not APPROVED
    // 3. Investment amount doesn't match shares * price per share (within tolerance)
    const statusNonCompliant = investment.status !== "CONFIRMED";
    const kycNonCompliant = investment.user.onboarding?.kycStatus !== "APPROVED";
    const expectedAmount = investment.shares * investment.pricePerShareAtPurchase;
    const amountMismatch = Math.abs(investment.totalAmount - expectedAmount) > 0.01;

    return statusNonCompliant || kycNonCompliant || amountMismatch;
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.propertyId) params.set("propertyId", filters.propertyId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    router.push(`/admin/investments?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      userId: "",
      propertyId: "",
      startDate: "",
      endDate: "",
    });
    router.push("/admin/investments");
  };

  const handleDelete = async (investmentId: string) => {
    setDeletingId(investmentId);
    try {
      const result = await deleteInvestment({
        investmentId,
        reason: deleteReason || undefined,
      });

      if (result.success) {
        router.refresh();
        setDeleteReason("");
      } else {
        alert("error" in result ? result.error : "Failed to delete investment");
      }
    } catch (error) {
      alert("An error occurred while deleting investment");
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters = Object.values(currentFilters).some((v) => v);
  const nonCompliantInvestments = investments.filter(isNonCompliant);

  return (
    <div className="space-y-4">
      {/* Non-Compliant Alert */}
      {nonCompliantInvestments.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {nonCompliantInvestments.length} non-compliant investment(s) found. Review and
                delete if necessary.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value === "all" ? "" : value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID</Label>
              <Input
                id="propertyId"
                type="text"
                placeholder="Property ID"
                value={filters.propertyId}
                onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
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

      {/* Investments Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
              <th className="h-12 px-4 text-left align-middle font-medium">User</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Property</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Shares</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Amount</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium">KYC Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Compliance</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-muted-foreground">
                  No investments found
                </td>
              </tr>
            ) : (
              investments.map((investment) => {
                const nonCompliant = isNonCompliant(investment);
                return (
                  <tr
                    key={investment.id}
                    className={`border-b ${nonCompliant ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}
                  >
                    <td className="p-4">
                      <p className="text-sm">
                        {format(investment.createdAt, "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/users/${investment.user.id}`}
                        className="font-semibold hover:underline"
                      >
                        {investment.user.name || investment.user.email || "Unknown"}
                      </Link>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/properties/${investment.property.slug}`}
                        className="font-semibold hover:underline"
                      >
                        {investment.property.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{investment.shares.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">
                        {formatCurrencyNGN(investment.totalAmount, "NGN")}
                      </p>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          investment.status === "CONFIRMED"
                            ? "default"
                            : investment.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {investment.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          investment.user.onboarding?.kycStatus === "APPROVED"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {investment.user.onboarding?.kycStatus || "N/A"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {nonCompliant ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Non-Compliant
                        </Badge>
                      ) : (
                        <Badge variant="default">Compliant</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${investment.user.id}/investments/${investment.id}/edit`}
                        >
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === investment.id}
                            >
                              {deletingId === investment.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Investment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this investment? This action cannot
                                be undone.
                                <br />
                                <br />
                                <strong>Investment Details:</strong>
                                <br />
                                User: {investment.user.name || investment.user.email}
                                <br />
                                Property: {investment.property.name}
                                <br />
                                Shares: {investment.shares.toLocaleString()}
                                <br />
                                Amount: {formatCurrencyNGN(investment.totalAmount, "NGN")}
                                <br />
                                Status: {investment.status}
                                <br />
                                Date: {format(investment.createdAt, "MMM d, yyyy")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="delete-reason">Reason for Deletion (Optional)</Label>
                                <Textarea
                                  id="delete-reason"
                                  value={deleteReason}
                                  onChange={(e) => setDeleteReason(e.target.value)}
                                  placeholder="Enter reason for deletion..."
                                  rows={3}
                                />
                              </div>
                              {nonCompliant && (
                                <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-3">
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Note:</strong> This investment is marked as
                                    non-compliant.
                                  </p>
                                </div>
                              )}
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deletingId === investment.id}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(investment.id)}
                                disabled={deletingId === investment.id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingId === investment.id ? (
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

