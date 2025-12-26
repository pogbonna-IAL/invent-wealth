"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { PayoutStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { WalletService } from "@/server/services/wallet.service";
import { PushNotificationService } from "@/server/services/push-notification.service";
import { formatCurrencyNGN } from "@/lib/utils/currency";

const approvePayoutSchema = z.object({
  payoutId: z.string().min(1),
  notes: z.string().optional(),
});

const approvePayoutsSchema = z.object({
  payoutIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

const submitPayoutsForApprovalSchema = z.object({
  payoutIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

const updatePayoutSchema = z.object({
  payoutId: z.string().min(1),
  status: z.enum(["PENDING", "PENDING_APPROVAL", "APPROVED", "PAID"]).optional(),
  amount: z.number().optional(),
  paidAt: z.string().optional().nullable(),
  paymentMethod: z.enum(["WALLET", "BANK_TRANSFER", "CHECK", "WIRE_TRANSFER", "MOBILE_MONEY", "CASH", "OTHER"]).optional().nullable(),
  paymentReference: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  adjustmentReason: z.string().optional(),
});

const bulkUpdatePayoutsSchema = z.object({
  payoutIds: z.array(z.string()).min(1),
  status: z.enum(["PENDING", "PENDING_APPROVAL", "APPROVED", "PAID"]),
  paidAt: z.string().optional(),
});

const importPayoutsCSVSchema = z.object({
  distributionId: z.string().min(1),
  csvData: z.string().min(1),
});

export async function approvePayout(data: z.infer<typeof approvePayoutSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { payoutId, notes } = approvePayoutSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { distribution: true },
      });

      if (!payout) {
        throw new Error("Payout not found");
      }

      // Only approve if status is PENDING or PENDING_APPROVAL
      if (payout.status === PayoutStatus.PAID) {
        throw new Error("Payout has already been paid");
      }

      if (payout.status === PayoutStatus.APPROVED) {
        throw new Error("Payout has already been approved");
      }

      const oldStatus = payout.status;

      // Update payout status
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.APPROVED,
          notes: notes || payout.notes,
        },
      });

      // Create audit log
      await tx.payoutAuditLog.create({
        data: {
          payoutId,
          changedBy: session.user.id,
          action: "PAYOUT_APPROVED",
          oldValue: { status: oldStatus },
          newValue: { status: PayoutStatus.APPROVED },
          reason: notes,
        },
      });

      return {
        success: true,
        payout: updatedPayout,
      };
    });
  } catch (error) {
    console.error("Approve payout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve payout",
    };
  }
}

export async function approvePayouts(data: z.infer<typeof approvePayoutsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { payoutIds, notes } = approvePayoutsSchema.parse(data);

    const results = await Promise.allSettled(
      payoutIds.map((payoutId) => approvePayout({ payoutId, notes }))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
      success: true,
      approvedCount: successful,
      failedCount: failed,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve payouts",
    };
  }
}

export async function submitPayoutsForApproval(
  data: z.infer<typeof submitPayoutsForApprovalSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { payoutIds, notes } = submitPayoutsForApprovalSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      const payouts = await tx.payout.findMany({
        where: {
          id: { in: payoutIds },
        },
      });

      if (payouts.length === 0) {
        throw new Error("No payouts found");
      }

      // Only submit payouts that are PENDING
      const validPayouts = payouts.filter(
        (p) => p.status === PayoutStatus.PENDING
      );

      if (validPayouts.length === 0) {
        throw new Error("No payouts in PENDING status to submit for approval");
      }

      // Update payouts to PENDING_APPROVAL
      const updatedPayouts = await tx.payout.updateMany({
        where: {
          id: { in: validPayouts.map((p) => p.id) },
        },
        data: {
          status: PayoutStatus.PENDING_APPROVAL,
        },
      });

      // Create audit logs
      await Promise.all(
        validPayouts.map((payout) =>
          tx.payoutAuditLog.create({
            data: {
              payoutId: payout.id,
              changedBy: session.user.id,
              action: "PAYOUT_SUBMITTED_FOR_APPROVAL",
              oldValue: { status: payout.status },
              newValue: { status: PayoutStatus.PENDING_APPROVAL },
              reason: notes,
            },
          })
        )
      );

      return {
        success: true,
        submittedCount: updatedPayouts.count,
      };
    });
  } catch (error) {
    console.error("Submit payouts for approval error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit payouts for approval",
    };
  }
}

export async function updatePayout(data: z.infer<typeof updatePayoutSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = updatePayoutSchema.parse(data);
    const { payoutId, adjustmentReason, ...updateData } = validated;

    return await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        throw new Error("Payout not found");
      }

      const oldValue = {
        status: payout.status,
        amount: Number(payout.amount),
        paidAt: payout.paidAt,
        paymentMethod: payout.paymentMethod,
        paymentReference: payout.paymentReference,
        bankAccount: payout.bankAccount,
        notes: payout.notes,
      };

      // Prepare update data
      const updatePayload: any = {};
      if (updateData.status !== undefined) {
        updatePayload.status = updateData.status;
      }
      if (updateData.amount !== undefined) {
        updatePayload.amount = updateData.amount;
      }
      if (updateData.paidAt !== undefined) {
        updatePayload.paidAt = updateData.paidAt ? new Date(updateData.paidAt) : null;
        if (updateData.paidAt && updatePayload.status === "PAID") {
          updatePayload.status = PayoutStatus.PAID;
        }
      }
      if (updateData.paymentMethod !== undefined) {
        updatePayload.paymentMethod = updateData.paymentMethod;
      }
      if (updateData.paymentReference !== undefined) {
        updatePayload.paymentReference = updateData.paymentReference;
      }
      if (updateData.bankAccount !== undefined) {
        updatePayload.bankAccount = updateData.bankAccount;
      }
      if (updateData.notes !== undefined) {
        updatePayload.notes = updateData.notes;
      }

      // Validate: If marking as PAID with non-WALLET method, require bank account
      const isMarkingAsPaid = updatePayload.status === PayoutStatus.PAID || 
        (updateData.status === "PAID") ||
        (updateData.paidAt && !payout.paidAt);
      const paymentMethod = updatePayload.paymentMethod || payout.paymentMethod;
      
      if (isMarkingAsPaid && paymentMethod && paymentMethod !== PaymentMethod.WALLET) {
        const bankAccount = updatePayload.bankAccount || payout.bankAccount;
        if (!bankAccount) {
          throw new Error("Bank account details are required for non-wallet payment methods");
        }
      }

      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: updatePayload,
      });

      // If marking as PAID with WALLET payment method, credit the user's wallet
      const wasPaid = updatedPayout.status === PayoutStatus.PAID && updatedPayout.paidAt;
      const wasNotPaidBefore = payout.status !== PayoutStatus.PAID || !payout.paidAt;
      const isWalletPayment = updatedPayout.paymentMethod === PaymentMethod.WALLET;

      if (wasPaid && wasNotPaidBefore && isWalletPayment) {
        // Credit the wallet
        await WalletService.creditWallet(
          updatedPayout.userId,
          Number(updatedPayout.amount),
          updatedPayout.id,
          tx
        );
      }

      // Send push notification if payout was marked as paid
      if (wasPaid && wasNotPaidBefore) {
        // Get property info for notification
        const property = await tx.property.findUnique({
          where: { id: updatedPayout.propertyId },
          select: { name: true },
        });

        // Send notification asynchronously (don't await to avoid blocking)
        PushNotificationService.sendToUser(updatedPayout.userId, {
          title: "Payout Processed",
          body: `Your payout of ${formatCurrencyNGN(Number(updatedPayout.amount), "NGN")} for ${property?.name || "property"} has been processed.`,
          icon: "/invent-alliance-logo-small.svg",
          badge: "/invent-alliance-logo-small.svg",
          tag: `payout-${updatedPayout.id}`,
          data: {
            url: "/income",
            payoutId: updatedPayout.id,
            propertyId: updatedPayout.propertyId,
          },
          requireInteraction: false,
        }).catch((error) => {
          // Don't fail the payout update if notification fails
          console.error("Failed to send payout notification:", error);
        });
      }

      // Create audit log if there were changes
      if (Object.keys(updatePayload).length > 0) {
        await tx.payoutAuditLog.create({
          data: {
            payoutId,
            changedBy: session.user.id,
            action: "PAYOUT_UPDATED",
            oldValue: oldValue,
            newValue: {
              status: updatedPayout.status,
              amount: Number(updatedPayout.amount),
              paidAt: updatedPayout.paidAt,
              paymentMethod: updatedPayout.paymentMethod,
              paymentReference: updatedPayout.paymentReference,
              bankAccount: updatedPayout.bankAccount,
              notes: updatedPayout.notes,
            },
            reason: adjustmentReason,
          },
        });
      }

      return {
        success: true,
        payout: updatedPayout,
      };
    });
  } catch (error) {
    console.error("Update payout error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update payout",
    };
  }
}

export async function bulkUpdatePayouts(data: z.infer<typeof bulkUpdatePayoutsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { payoutIds, status, paidAt } = bulkUpdatePayoutsSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      const updatePayload: any = {
        status: status as PayoutStatus,
      };

      if (paidAt && status === "PAID") {
        updatePayload.paidAt = new Date(paidAt);
      }

      const result = await tx.payout.updateMany({
        where: {
          id: { in: payoutIds },
        },
        data: updatePayload,
      });

      // Create audit logs
      const payouts = await tx.payout.findMany({
        where: { id: { in: payoutIds } },
      });

      await Promise.all(
        payouts.map((payout) =>
          tx.payoutAuditLog.create({
            data: {
              payoutId: payout.id,
              changedBy: session.user.id,
              action: "PAYOUT_BULK_UPDATED",
              oldValue: { status: payout.status },
              newValue: { status: updatePayload.status },
            },
          })
        )
      );

      return {
        success: true,
        updatedCount: result.count,
      };
    });
  } catch (error) {
    console.error("Bulk update payouts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update payouts",
    };
  }
}

export async function importPayoutsCSV(data: z.infer<typeof importPayoutsCSVSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId, csvData } = importPayoutsCSVSchema.parse(data);

    // Parse CSV data
    const lines = csvData.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const payoutIdIndex = header.indexOf("payout_id");
    const statusIndex = header.indexOf("status");
    const amountIndex = header.indexOf("amount");
    const paidAtIndex = header.indexOf("paid_at");

    if (payoutIdIndex === -1 || statusIndex === -1) {
      throw new Error("CSV must include payout_id and status columns");
    }

    const errors: string[] = [];
    let updatedCount = 0;

    return await prisma.$transaction(async (tx) => {
      // Get all payouts for this distribution
      const payouts = await tx.payout.findMany({
        where: { distributionId },
      });

      const payoutMap = new Map(payouts.map((p) => [p.id, p]));

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((cell) => cell.trim());
        if (row.length === 0 || row.every((cell) => !cell)) continue;

        const payoutId = row[payoutIdIndex];
        if (!payoutId) {
          errors.push(`Row ${i + 1}: Missing payout_id`);
          continue;
        }

        const payout = payoutMap.get(payoutId);
        if (!payout) {
          errors.push(`Row ${i + 1}: Payout ${payoutId} not found in this distribution`);
          continue;
        }

        const updatePayload: any = {};

        // Update status if provided
        if (statusIndex !== -1 && row[statusIndex]) {
          const status = row[statusIndex].toUpperCase();
          if (!["PENDING", "PENDING_APPROVAL", "APPROVED", "PAID"].includes(status)) {
            errors.push(`Row ${i + 1}: Invalid status "${row[statusIndex]}"`);
            continue;
          }
          updatePayload.status = status as PayoutStatus;
        }

        // Update amount if provided
        if (amountIndex !== -1 && row[amountIndex]) {
          const amount = parseFloat(row[amountIndex]);
          if (isNaN(amount) || amount < 0) {
            errors.push(`Row ${i + 1}: Invalid amount "${row[amountIndex]}"`);
            continue;
          }
          updatePayload.amount = amount;
        }

        // Update paidAt if provided
        if (paidAtIndex !== -1 && row[paidAtIndex]) {
          try {
            const paidAt = new Date(row[paidAtIndex]);
            if (isNaN(paidAt.getTime())) {
              errors.push(`Row ${i + 1}: Invalid paid_at date "${row[paidAtIndex]}"`);
              continue;
            }
            updatePayload.paidAt = paidAt;
            // If setting paidAt but status wasn't explicitly set to PAID, set it to PAID
            if (!updatePayload.status) {
              updatePayload.status = PayoutStatus.PAID;
            } else if (updatePayload.status !== PayoutStatus.PAID) {
              // If status was set but not PAID, still set to PAID when paidAt is provided
              updatePayload.status = PayoutStatus.PAID;
            }
          } catch {
            errors.push(`Row ${i + 1}: Invalid paid_at date format`);
            continue;
          }
        }

        // Update payout if there are changes
        if (Object.keys(updatePayload).length > 0) {
          const oldValue = {
            status: payout.status,
            amount: Number(payout.amount),
            paidAt: payout.paidAt,
          };

          await tx.payout.update({
            where: { id: payoutId },
            data: updatePayload,
          });

          // Create audit log
          await tx.payoutAuditLog.create({
            data: {
              payoutId,
              changedBy: session.user.id,
              action: "PAYOUT_UPDATED_VIA_CSV",
              oldValue: oldValue,
              newValue: {
                status: updatePayload.status || payout.status,
                amount: updatePayload.amount !== undefined ? updatePayload.amount : Number(payout.amount),
                paidAt: updatePayload.paidAt || payout.paidAt,
              },
              reason: "Bulk update via CSV import",
            },
          });

          updatedCount++;
        }
      }

      if (errors.length > 0 && updatedCount === 0) {
        return {
          success: false,
          error: "Failed to import payouts",
          errors,
          updated: 0,
        };
      }

      return {
        success: true,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    });
  } catch (error) {
    console.error("Import payouts CSV error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import payouts from CSV",
      updated: 0,
    };
  }
}
