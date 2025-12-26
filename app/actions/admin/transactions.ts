"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const deleteTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
});

export async function deleteTransaction(data: z.infer<typeof deleteTransactionSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = deleteTransactionSchema.parse(data);

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: validated.transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: validated.transactionId },
    });

    // Log the deletion in audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE_TRANSACTION",
          metadata: {
            transactionId: validated.transactionId,
            transactionType: transaction.type,
            amount: Number(transaction.amount),
            currency: transaction.currency,
            reference: transaction.reference,
            deletedForUser: transaction.user.id,
            deletedForUserName: transaction.user.name || transaction.user.email,
          },
        },
      });
    } catch (auditError) {
      // Don't fail the deletion if audit logging fails
      console.error("Failed to log transaction deletion:", auditError);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Delete transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transaction",
    };
  }
}

const bulkDeleteTransactionsSchema = z.object({
  transactionIds: z.array(z.string()).min(1, "At least one transaction ID is required"),
});

export async function bulkDeleteTransactions(data: z.infer<typeof bulkDeleteTransactionsSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = bulkDeleteTransactionsSchema.parse(data);

    // Check if all transactions exist
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: validated.transactionIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (transactions.length !== validated.transactionIds.length) {
      return { success: false, error: "Some transactions were not found" };
    }

    // Delete all transactions
    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: validated.transactionIds },
      },
    });

    // Log the bulk deletion in audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "BULK_DELETE_TRANSACTIONS",
          metadata: {
            transactionIds: validated.transactionIds,
            count: result.count,
            transactions: transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount),
              userId: t.userId,
            })),
          },
        },
      });
    } catch (auditError) {
      // Don't fail the deletion if audit logging fails
      console.error("Failed to log bulk transaction deletion:", auditError);
    }

    return { success: true, deletedCount: result.count };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Bulk delete transactions error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transactions",
    };
  }
}

