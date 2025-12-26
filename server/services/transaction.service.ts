import { prisma } from "@/server/db/prisma";
import { TransactionType } from "@prisma/client";

interface TransactionFilters {
  type?: TransactionType | string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export class TransactionService {
  /**
   * Get user's transactions with optional filters
   */
  static async getUserTransactions(
    userId: string,
    filters: TransactionFilters = {}
  ) {
    const where: any = {
      userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    return prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get transaction summary statistics
   */
  static async getTransactionSummary(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    const totalInvested = transactions
      .filter((t) => t.type === "INVESTMENT")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalReceived = transactions
      .filter((t) => t.type === "PAYOUT")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalInvested,
      totalReceived,
      totalTransactions: transactions.length,
      investmentCount: transactions.filter((t) => t.type === "INVESTMENT").length,
      payoutCount: transactions.filter((t) => t.type === "PAYOUT").length,
    };
  }
}

