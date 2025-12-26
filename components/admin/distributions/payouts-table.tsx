"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePayout, bulkUpdatePayouts, approvePayout, approvePayouts, submitPayoutsForApproval } from "@/app/actions/admin/payouts";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { format } from "date-fns";
import { Loader2, Save, X, CheckCircle2, FileCheck, Send } from "lucide-react";
import { PaymentMethod } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";

interface Payout {
  id: string;
  userId: string;
  sharesAtRecord: number;
  amount: number | string;
  status: "PENDING" | "PENDING_APPROVAL" | "APPROVED" | "PAID";
  paidAt: Date | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  bankAccount: string | null;
  notes: string | null;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface PayoutsTableProps {
  payouts: Payout[];
  distributionId: string;
}

export function PayoutsTable({ payouts, distributionId }: PayoutsTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [editData, setEditData] = useState<{
    status?: "PENDING" | "PENDING_APPROVAL" | "APPROVED" | "PAID";
    amount?: string;
    paidAt?: string;
    paymentMethod?: PaymentMethod | "";
    paymentReference?: string;
    bankAccount?: string;
    notes?: string;
    adjustmentReason?: string;
  }>({});
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false);

  const handleEdit = (payout: Payout) => {
    setEditingId(payout.id);
    setEditData({
      status: payout.status,
      amount: Number(payout.amount).toFixed(2),
      paidAt: payout.paidAt ? format(new Date(payout.paidAt), "yyyy-MM-dd'T'HH:mm") : "",
      paymentMethod: payout.paymentMethod || "",
      paymentReference: payout.paymentReference || "",
      bankAccount: payout.bankAccount || "",
      notes: payout.notes || "",
      adjustmentReason: "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (payoutId: string) => {
    setIsSaving(payoutId);
    try {
      // Validate: If marking as PAID with non-WALLET payment method, require bank account
      const isMarkingAsPaid = editData.status === "PAID" || editData.paidAt;
      const paymentMethod = editData.paymentMethod || "";
      const bankAccount = editData.bankAccount || "";
      
      if (isMarkingAsPaid && paymentMethod && paymentMethod !== "WALLET" && !bankAccount) {
        alert("Bank account details are required for non-wallet payment methods");
        return;
      }

      const updatePayload: any = {};
      if (editData.status !== undefined) {
        updatePayload.status = editData.status;
      }
      if (editData.amount !== undefined) {
        updatePayload.amount = parseFloat(editData.amount);
      }
      if (editData.paidAt !== undefined) {
        updatePayload.paidAt = editData.paidAt || null;
      }
      if (editData.paymentMethod !== undefined) {
        updatePayload.paymentMethod = editData.paymentMethod || null;
      }
      if (editData.paymentReference !== undefined) {
        updatePayload.paymentReference = editData.paymentReference || null;
      }
      if (editData.bankAccount !== undefined) {
        updatePayload.bankAccount = editData.bankAccount || null;
      }
      if (editData.notes !== undefined) {
        updatePayload.notes = editData.notes || null;
      }
      if (editData.adjustmentReason) {
        updatePayload.adjustmentReason = editData.adjustmentReason;
      }

      const result = await updatePayout({
        payoutId,
        ...updatePayload,
      });

      if (result.success) {
        const paymentMethodName = paymentMethod === "WALLET" ? "wallet" : paymentMethod.toLowerCase().replace(/_/g, " ");
        alert(`Payout updated successfully${isMarkingAsPaid && paymentMethod === "WALLET" ? ". User's wallet has been credited." : ""}`);
        setEditingId(null);
        setEditData({});
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to update payout");
      }
    } catch (error) {
      alert("An error occurred while updating payout");
    } finally {
      setIsSaving(null);
    }
  };

  const handleBulkUpdate = async (status: "PENDING" | "PAID") => {
    if (selectedIds.size === 0) {
      alert("Please select at least one payout");
      return;
    }

    setIsBulkUpdating(true);
    try {
      const result = await bulkUpdatePayouts({
        payoutIds: Array.from(selectedIds),
        status,
        paidAt: status === "PAID" ? new Date().toISOString() : "",
      });

      if (result.success && "updatedCount" in result) {
        alert(`Updated ${result.updatedCount} payout(s)`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to update payouts");
      }
    } catch (error) {
      alert("An error occurred while updating payouts");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === payouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payouts.map((p) => p.id)));
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

  const handleApprove = async (payoutId: string) => {
    setIsApproving(payoutId);
    try {
      const result = await approvePayout({ payoutId });
      if (result.success) {
        alert("Payout approved successfully");
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to approve payout");
      }
    } catch (error) {
      alert("An error occurred while approving payout");
    } finally {
      setIsApproving(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one payout");
      return;
    }

    setIsBulkUpdating(true);
    try {
      const result = await approvePayouts({
        payoutIds: Array.from(selectedIds),
      });

      if (result.success && "approvedCount" in result) {
        alert(`Approved ${result.approvedCount} payout(s)`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to approve payouts");
      }
    } catch (error) {
      alert("An error occurred while approving payouts");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkSubmitForApproval = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one payout");
      return;
    }

    setIsSubmittingForApproval(true);
    try {
      const result = await submitPayoutsForApproval({
        payoutIds: Array.from(selectedIds),
      });

      if (result.success && "submittedCount" in result) {
        alert(`Submitted ${result.submittedCount} payout(s) for approval`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert("error" in result ? result.error : "Failed to submit payouts for approval");
      }
    } catch (error) {
      alert("An error occurred while submitting payouts for approval");
    } finally {
      setIsSubmittingForApproval(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            {selectedIds.size} payout(s) selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSubmitForApproval}
              disabled={isSubmittingForApproval}
            >
              {isSubmittingForApproval ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit for Approval
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkApprove}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="mr-2 h-4 w-4" />
              )}
              Approve Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkUpdate("PAID")}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Paid
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === payouts.length && payouts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Investor</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Payment Reference</TableHead>
              <TableHead>Bank Account</TableHead>
              <TableHead>Paid At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No payouts found
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((payout) => {
                const isEditing = editingId === payout.id;
                const isSelected = selectedIds.has(payout.id);

                return (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(payout.id)}
                        disabled={isEditing}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payout.user.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{payout.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{payout.sharesAtRecord.toLocaleString()}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editData.amount || ""}
                          onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        <span className="font-semibold">
                          {formatCurrencyNGN(Number(payout.amount), "NGN")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.status}
                          onValueChange={(value) =>
                            setEditData({ ...editData, status: value as "PENDING" | "PENDING_APPROVAL" | "APPROVED" | "PAID" })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="PENDING_APPROVAL">PENDING_APPROVAL</SelectItem>
                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                            <SelectItem value="PAID">PAID</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={
                            payout.status === "PAID"
                              ? "default"
                              : payout.status === "APPROVED"
                              ? "default"
                              : payout.status === "PENDING_APPROVAL"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {payout.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.paymentMethod || "all"}
                          onValueChange={(value) =>
                            setEditData({ ...editData, paymentMethod: value === "all" ? "" : value as PaymentMethod })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">None</SelectItem>
                            <SelectItem value="WALLET">Wallet</SelectItem>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="CHECK">Check</SelectItem>
                            <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
                            <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">
                          {payout.paymentMethod
                            ? payout.paymentMethod.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            : "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="text"
                          value={editData.paymentReference || ""}
                          onChange={(e) => setEditData({ ...editData, paymentReference: e.target.value })}
                          placeholder="Transaction ID"
                          className="w-40"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {payout.paymentReference || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="text"
                          value={editData.bankAccount || ""}
                          onChange={(e) => setEditData({ ...editData, bankAccount: e.target.value })}
                          placeholder={editData.paymentMethod === "WALLET" ? "Not required" : "Required for non-wallet"}
                          className={`w-40 ${editData.paymentMethod && editData.paymentMethod !== "WALLET" && editData.status === "PAID" && !editData.bankAccount ? "border-red-500" : ""}`}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {payout.bankAccount || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="datetime-local"
                          value={editData.paidAt || ""}
                          onChange={(e) => setEditData({ ...editData, paidAt: e.target.value })}
                          className="w-48"
                        />
                      ) : (
                        <span className="text-sm">
                          {payout.paidAt
                            ? format(new Date(payout.paidAt), "MMM d, yyyy HH:mm")
                            : "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(payout.id)}
                            disabled={isSaving === payout.id}
                          >
                            {isSaving === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={isSaving === payout.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {(payout.status === "PENDING" || payout.status === "PENDING_APPROVAL") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(payout.id)}
                              disabled={isApproving === payout.id}
                            >
                              {isApproving === payout.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileCheck className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(payout)}>
                            Edit
                          </Button>
                        </div>
                      )}
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

