import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";

export class WalletService {
  /**
   * Calculate user's wallet balance from transactions
   * Balance = Sum of PAYOUT transactions - Sum of INVESTMENT transactions
   */
  static async getWalletBalance(userId: string): Promise<number> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: {
        type: true,
        amount: true,
      },
    });

    let balance = 0;
    for (const tx of transactions) {
      if (tx.type === "PAYOUT") {
        balance += Number(tx.amount);
      } else if (tx.type === "INVESTMENT") {
        balance -= Number(tx.amount);
      }
    }

    return balance;
  }

  /**
   * Credit user's wallet by creating a PAYOUT transaction
   * This is called when a payout is marked as PAID with paymentMethod WALLET
   */
  static async creditWallet(
    userId: string,
    amount: number,
    payoutId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const prismaClient = tx || prisma;

    await prismaClient.transaction.create({
      data: {
        userId,
        type: "PAYOUT",
        amount: amount,
        currency: "NGN",
        reference: `PAYOUT-${payoutId}`,
      },
    });
  }

  /**
   * Get wallet transactions for a user
   */
  static async getWalletTransactions(userId: string) {
    return prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["PAYOUT", "INVESTMENT"] },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

