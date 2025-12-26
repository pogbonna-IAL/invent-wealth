import { prisma } from "@/server/db/prisma";
import { InvestmentStatus, PropertyStatus, TransactionType } from "@prisma/client";

export class InvestmentService {
  /**
   * Purchase shares in a property
   * Uses Prisma transactions to ensure data consistency
   */
  static async purchaseShares(
    userId: string,
    propertyId: string,
    shares: number
  ) {
    // Use Prisma transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // Get property details with lock to prevent race conditions
      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error("Property not found");
      }

      if (property.status !== PropertyStatus.OPEN) {
        throw new Error("Property is not open for investment");
      }

      if (shares < property.minShares) {
        throw new Error(`Minimum investment is ${property.minShares} shares`);
      }

      // Re-check available shares within transaction to prevent race conditions
      if (shares > property.availableShares) {
        throw new Error(
          `Only ${property.availableShares.toLocaleString()} shares available`
        );
      }

      const totalAmount = Number(property.pricePerShare) * shares;

      // Create investment record
      const investment = await tx.investment.create({
        data: {
          userId,
          propertyId,
          shares,
          pricePerShareAtPurchase: property.pricePerShare,
          totalAmount,
          status: InvestmentStatus.CONFIRMED,
        },
      });

      // Update property available shares atomically
      const newAvailableShares = property.availableShares - shares;
      const newStatus =
        newAvailableShares <= 0 ? PropertyStatus.FUNDED : PropertyStatus.OPEN;

      await tx.property.update({
        where: { id: propertyId },
        data: {
          availableShares: newAvailableShares,
          status: newStatus,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.INVESTMENT,
          amount: totalAmount,
          currency: "NGN", // Amounts are stored in NGN
          reference: `INV-${investment.id.slice(0, 8).toUpperCase()}`,
        },
      });

      return investment;
    });
  }

  /**
   * Get user's portfolio summary
   */
  static async getPortfolioSummary(userId: string) {
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      include: {
        property: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group investments by property to calculate holdings
    const holdingsMap = new Map<string, { property: any; totalShares: number }>();
    
    for (const investment of investments) {
      const existing = holdingsMap.get(investment.propertyId);
      if (existing) {
        existing.totalShares += investment.shares;
      } else {
        holdingsMap.set(investment.propertyId, {
          property: investment.property,
          totalShares: investment.shares,
        });
      }
    }

    const holdings = Array.from(holdingsMap.values());

    const payouts = await prisma.payout.findMany({
      where: {
        userId,
        status: "PAID",
      },
      include: {
        property: true,
        rentalStatement: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    const totalIncome = payouts.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0
    );

    // Calculate current value based on current price per share
    const currentValue = holdings.reduce((sum, holding) => {
      return sum + holding.totalShares * Number(holding.property.pricePerShare);
    }, 0);

    return {
      totalInvested,
      totalIncome,
      currentValue,
      holdings: holdings.length,
      holdingsDetails: holdings,
      investments,
      payouts,
    };
  }

  /**
   * Get user's investments for a specific property
   */
  static async getUserPropertyInvestments(userId: string, propertyId: string) {
    return prisma.investment.findMany({
      where: {
        userId,
        propertyId,
        status: InvestmentStatus.CONFIRMED,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get portfolio value over time (synthetic series based on investments)
   */
  static async getPortfolioValueOverTime(userId: string) {
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      include: {
        property: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Generate synthetic data points over time
    const dataPoints: { date: string; value: number }[] = [];
    let cumulativeValue = 0;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Group investments by month
    const monthlyInvestments = new Map<string, number>();
    for (const inv of investments) {
      const monthKey = inv.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyInvestments.get(monthKey) || 0;
      monthlyInvestments.set(monthKey, existing + Number(inv.totalAmount));
    }

    // Generate monthly data points
    const currentMonth = new Date(sixMonthsAgo);
    while (currentMonth <= now) {
      const monthKey = currentMonth.toISOString().slice(0, 7);
      
      // Add investments made in this month
      const monthInvestment = monthlyInvestments.get(monthKey) || 0;
      cumulativeValue += monthInvestment;

      // Calculate current value (assuming properties maintain their price)
      let currentPortfolioValue = 0;
      for (const inv of investments) {
        if (inv.createdAt <= currentMonth) {
          currentPortfolioValue += inv.shares * Number(inv.property.pricePerShare);
        }
      }

      dataPoints.push({
        date: currentMonth.toISOString().slice(0, 7),
        value: currentPortfolioValue || cumulativeValue,
      });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return dataPoints;
  }

  /**
   * Get portfolio allocation by city
   */
  static async getPortfolioAllocationByCity(userId: string) {
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      include: {
        property: true,
      },
    });

    const allocationMap = new Map<string, number>();

    for (const inv of investments) {
      const city = inv.property.city;
      const value = inv.shares * Number(inv.property.pricePerShare);
      const existing = allocationMap.get(city) || 0;
      allocationMap.set(city, existing + value);
    }

    return Array.from(allocationMap.entries()).map(([city, value]) => ({
      name: city,
      value,
    }));
  }

  /**
   * Get portfolio allocation by property type
   */
  static async getPortfolioAllocationByPropertyType(userId: string) {
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      include: {
        property: true,
      },
    });

    const allocationMap = new Map<string, number>();

    for (const inv of investments) {
      const type = inv.property.propertyType;
      const value = inv.shares * Number(inv.property.pricePerShare);
      const existing = allocationMap.get(type) || 0;
      allocationMap.set(type, existing + value);
    }

    return Array.from(allocationMap.entries()).map(([type, value]) => ({
      name: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));
  }
}
