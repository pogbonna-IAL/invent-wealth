import { prisma } from "@/server/db/prisma";
import { DistributionStatus, PayoutStatus, TransactionType, PaymentMethod, Prisma } from "@prisma/client";
import { SystemUserService } from "./system-user.service";

export class DistributionService {
  /**
   * Create rental statement and distribution
   */
  static async createRentalStatement(
    propertyId: string,
    periodStart: Date,
    periodEnd: Date,
    grossRevenue: number,
    operatingCosts: number,
    managementFee: number,
    occupancyRatePct: number,
    adr: number,
    notes?: string,
    incomeAdjustment: number = 0
  ) {
    const netDistributable = grossRevenue - operatingCosts - managementFee + incomeAdjustment;

    // Create rental statement
    const rentalStatement = await prisma.rentalStatement.create({
      data: {
        propertyId,
        periodStart,
        periodEnd,
        grossRevenue,
        operatingCosts,
        managementFee,
        incomeAdjustment,
        netDistributable,
        occupancyRatePct,
        adr,
        notes,
      },
    });

    // Create distribution
    const distribution = await prisma.distribution.create({
      data: {
        propertyId,
        rentalStatementId: rentalStatement.id,
        declaredAt: periodEnd,
        totalDistributed: netDistributable,
        status: DistributionStatus.DECLARED,
      },
    });

    // Get all confirmed investments for this property
    const investments = await prisma.investment.findMany({
      where: {
        propertyId,
        status: "CONFIRMED",
      },
    });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // Get or create under_writer system user
    const underWriter = await SystemUserService.getOrCreateUnderWriter();

    const totalShares = property.totalShares;
    // Calculate sold shares from actual confirmed investments (more accurate than stored value)
    const soldShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
    const availableShares = totalShares - soldShares; // Calculate dynamically

    // Create payouts for each investor based on their percentage of TOTAL shares
    // Formula: (userShares / totalShares) * netDistributable
    const investorPayouts = await Promise.all(
      investments.map(async (investment) => {
        const payoutAmount =
          (Number(investment.shares) / totalShares) * netDistributable;

        return prisma.payout.create({
          data: {
            userId: investment.userId,
            propertyId,
            distributionId: distribution.id,
            rentalStatementId: rentalStatement.id,
            sharesAtRecord: investment.shares,
            amount: payoutAmount,
            status: PayoutStatus.PENDING,
          },
        });
      })
    );

    // Create payout for under_writer if there are unsold shares
    let underWriterPayout = null;
    if (availableShares > 0) {
      const unsoldSharesPercentage = availableShares / totalShares;
      const underWriterAmount = (availableShares / totalShares) * netDistributable;

      underWriterPayout = await prisma.payout.create({
        data: {
          userId: underWriter.id,
          propertyId,
          distributionId: distribution.id,
          rentalStatementId: rentalStatement.id,
          sharesAtRecord: availableShares,
          amount: underWriterAmount,
          status: PayoutStatus.PENDING,
          notes: `System payout for ${availableShares} unsold shares (${(unsoldSharesPercentage * 100).toFixed(2)}% of total shares)`,
        },
      });
    }

    const allPayouts = [...investorPayouts, ...(underWriterPayout ? [underWriterPayout] : [])];

    return { rentalStatement, distribution, payouts: allPayouts };
  }

  /**
   * Delete distribution (only if not paid)
   */
  static async deleteDistribution(
    distributionId: string,
    deletedBy: string,
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const distribution = await tx.distribution.findUnique({
        where: { id: distributionId },
        include: { payouts: true },
      });

      if (!distribution) {
        throw new Error("Distribution not found");
      }

      if (distribution.status === DistributionStatus.PAID) {
        throw new Error("Cannot delete a fully paid distribution");
      }

      const paidPayouts = distribution.payouts.filter(
        (p) => p.status === PayoutStatus.PAID
      );

      if (paidPayouts.length > 0) {
        throw new Error(
          `Cannot delete: ${paidPayouts.length} payout(s) already paid`
        );
      }

      // Delete transactions (if any were created)
      const payoutIds = distribution.payouts.map((p) => p.id);
      const payoutReferences = payoutIds.map(
        (id) => `PAY-${id.slice(0, 8).toUpperCase()}`
      );

      await tx.transaction.deleteMany({
        where: {
          reference: {
            in: payoutReferences,
          },
        },
      });

      // Delete payouts
      await tx.payout.deleteMany({
        where: { distributionId },
      });

      // Delete distribution
      await tx.distribution.delete({
        where: { id: distributionId },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: deletedBy,
          action: "DISTRIBUTION_DELETED",
          metadata: {
            distributionId,
            reason,
            totalDistributed: Number(distribution.totalDistributed),
            payoutsDeleted: distribution.payouts.length,
          },
        },
      });

      return { success: true };
    });
  }

  /**
   * Mark payouts as paid
   */
  static async markPayoutsAsPaid(payoutIds: string[]) {
    const payouts = await prisma.payout.updateMany({
      where: {
        id: {
          in: payoutIds,
        },
      },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Create transaction records for paid payouts
    const paidPayouts = await prisma.payout.findMany({
      where: {
        id: {
          in: payoutIds,
        },
      },
    });

    await prisma.transaction.createMany({
      data: paidPayouts.map((payout) => ({
        userId: payout.userId,
        type: TransactionType.PAYOUT,
        amount: payout.amount,
        currency: "NGN", // Amounts are stored in NGN
        reference: `PAY-${payout.id.slice(0, 8).toUpperCase()}`,
      })),
    });

    // Update distribution status if all payouts are paid
    const distributionIds = [...new Set(paidPayouts.map((p) => p.distributionId))];
    
    for (const distributionId of distributionIds) {
      const unpaidPayouts = await prisma.payout.count({
        where: {
          distributionId,
          status: PayoutStatus.PENDING,
        },
      });

      if (unpaidPayouts === 0) {
        await prisma.distribution.update({
          where: { id: distributionId },
          data: { status: DistributionStatus.PAID },
        });
      }
    }

    return payouts;
  }

  /**
   * Get user's payout history
   */
  static async getUserPayouts(userId: string) {
    return prisma.payout.findMany({
      where: { userId },
      include: {
        property: true,
        rentalStatement: true,
        distribution: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get property rental statements
   */
  static async getPropertyRentalStatements(propertyId: string) {
    return prisma.rentalStatement.findMany({
      where: { propertyId },
      include: {
        distributions: {
          include: {
            payouts: true,
          },
        },
      },
      orderBy: {
        periodStart: "desc",
      },
    });
  }

  /**
   * Get next expected distribution date for user's properties
   */
  static async getNextExpectedDistributionDate(userId: string): Promise<Date | null> {
    // Get all properties user has invested in
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: "CONFIRMED",
      },
      select: {
        propertyId: true,
      },
      distinct: ["propertyId"],
    });

    if (investments.length === 0) {
      return null;
    }

    const propertyIds = investments.map((inv) => inv.propertyId);

    // Get the most recent rental statement for each property
    const latestStatements = await prisma.rentalStatement.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      orderBy: {
        periodEnd: "desc",
      },
    });

    if (latestStatements.length === 0) {
      return null;
    }

    // Find the most recent period end date
    const latestPeriodEnd = latestStatements[0].periodEnd;

    // Next distribution is typically one month after the last period end
    const nextDate = new Date(latestPeriodEnd);
    nextDate.setMonth(nextDate.getMonth() + 1);

    return nextDate;
  }

  /**
   * Get income distributions over time for a user
   */
  static async getIncomeDistributionsOverTime(userId: string) {
    const payouts = await prisma.payout.findMany({
      where: {
        userId,
        status: "PAID",
      },
      include: {
        rentalStatement: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    // Group by month
    const monthlyData = new Map<string, number>();

    for (const payout of payouts) {
      if (payout.paidAt) {
        const monthKey = payout.paidAt.toISOString().slice(0, 7); // YYYY-MM
        const existing = monthlyData.get(monthKey) || 0;
        monthlyData.set(monthKey, existing + Number(payout.amount));
      }
    }

    return Array.from(monthlyData.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Create a draft distribution for a property based on a rental statement
   * Calculates payouts for all investors based on their share ownership
   */
  static async createDraftDistribution(
    propertyId: string,
    rentalStatementId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Get rental statement
      const rentalStatement = await tx.rentalStatement.findUnique({
        where: { id: rentalStatementId },
      });

      if (!rentalStatement) {
        throw new Error("Rental statement not found");
      }

      if (rentalStatement.propertyId !== propertyId) {
        throw new Error("Rental statement does not belong to this property");
      }

      // Check if distribution already exists
      const existingDistribution = await tx.distribution.findFirst({
        where: { rentalStatementId },
      });

      if (existingDistribution) {
        throw new Error("Distribution already exists for this rental statement");
      }

      // Get property details
      const property = await tx.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error("Property not found");
      }

      // Get all confirmed investments for this property
      const investments = await tx.investment.findMany({
        where: {
          propertyId,
          status: "CONFIRMED",
        },
      });

      const totalInvestedShares = investments.reduce(
        (sum, inv) => sum + inv.shares,
        0
      );

      // Validate that we have at least some investments
      if (totalInvestedShares === 0) {
        throw new Error("No shares have been purchased for this property");
      }

      const netDistributable = Number(rentalStatement.netDistributable);

      // Create distribution record as DRAFT
      const distribution = await tx.distribution.create({
        data: {
          propertyId,
          rentalStatementId,
          totalDistributed: netDistributable,
          status: "DRAFT",
        },
      });

      // NEW LOGIC: Use totalShares as denominator instead of totalOutstandingShares
      // This ensures distributions are based on percentage of total available shares
      const totalShares = property.totalShares;
      // Calculate sold shares from actual confirmed investments (more accurate than stored value)
      const soldShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
      const availableShares = totalShares - soldShares; // Calculate dynamically

      // Calculate percentage of sold vs unsold shares
      const soldSharesPercentage = soldShares / totalShares;
      const unsoldSharesPercentage = availableShares / totalShares;

      // Calculate amounts
      const investorDistributable = netDistributable * soldSharesPercentage;
      const underWriterDistributable = netDistributable * unsoldSharesPercentage;

      // Get or create under_writer system user (within transaction)
      const underWriter = await SystemUserService.getOrCreateUnderWriter(tx);

      // Create payouts for each investor based on their percentage of TOTAL shares
      // Formula: (userShares / totalShares) * netDistributable
      const investorPayouts = await Promise.all(
        investments.map(async (investment) => {
          const userShares = investment.shares;
          // Calculate payout based on percentage of total shares
          const payoutAmount = (userShares / totalShares) * netDistributable;

          return tx.payout.create({
            data: {
              userId: investment.userId,
              propertyId,
              distributionId: distribution.id,
              rentalStatementId,
              sharesAtRecord: userShares,
              amount: payoutAmount,
              status: "PENDING",
            },
          });
        })
      );

      // Create payout for under_writer if there are unsold shares
      let underWriterPayout = null;
      if (availableShares > 0 && underWriterDistributable > 0) {
        underWriterPayout = await tx.payout.create({
          data: {
            userId: underWriter.id,
            propertyId,
            distributionId: distribution.id,
            rentalStatementId,
            sharesAtRecord: availableShares, // Record unsold shares
            amount: underWriterDistributable,
            status: "PENDING",
            notes: `System payout for ${availableShares} unsold shares (${(unsoldSharesPercentage * 100).toFixed(2)}% of total shares)`,
          },
        });
      }

      const allPayouts = [...investorPayouts, ...(underWriterPayout ? [underWriterPayout] : [])];

      return {
        distribution,
        payouts: allPayouts,
        totalShares,
        soldShares,
        availableShares,
        investorDistributable,
        underWriterDistributable,
        netDistributable,
      };
    });
  }

  /**
   * Recalculate payouts for a distribution when the net distributable amount changes
   * Only works for DRAFT distributions
   */
  static async recalculateDistributionPayouts(
    distributionId: string,
    newNetDistributable: number,
    tx?: Prisma.TransactionClient
  ) {
    const transaction = tx || prisma;

    // If we're already in a transaction, use it directly
    if (tx) {
      // Get distribution
      const distribution = await transaction.distribution.findUnique({
        where: { id: distributionId },
        include: {
          rentalStatement: {
            include: {
              property: true,
            },
          },
        },
      });

      if (!distribution) {
        throw new Error("Distribution not found");
      }

      if (distribution.status !== DistributionStatus.DRAFT) {
        throw new Error("Can only recalculate payouts for DRAFT distributions");
      }

      const property = distribution.rentalStatement.property;
      
      // Get all confirmed investments first
      const investments = await transaction.investment.findMany({
        where: {
          propertyId: distribution.propertyId,
          status: "CONFIRMED",
        },
      });

      const totalShares = property.totalShares;
      // Calculate sold shares from actual confirmed investments (more accurate than stored value)
      const soldShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
      const availableShares = totalShares - soldShares; // Calculate dynamically

      // Delete existing payouts for this distribution
      await transaction.payout.deleteMany({
        where: { distributionId },
      });

      // Calculate new payouts
      const soldSharesPercentage = soldShares / totalShares;
      const unsoldSharesPercentage = availableShares / totalShares;

      const investorDistributable = newNetDistributable * soldSharesPercentage;
      const underWriterDistributable = newNetDistributable * unsoldSharesPercentage;

      // Get or create under_writer system user
      const underWriter = await SystemUserService.getOrCreateUnderWriter(transaction);

      // Create payouts for each investor
      const investorPayouts = await Promise.all(
        investments.map(async (investment) => {
          const userShares = investment.shares;
          const payoutAmount = (userShares / totalShares) * newNetDistributable;

          return transaction.payout.create({
            data: {
              userId: investment.userId,
              propertyId: distribution.propertyId,
              distributionId: distribution.id,
              rentalStatementId: distribution.rentalStatementId,
              sharesAtRecord: userShares,
              amount: payoutAmount,
              status: "PENDING",
            },
          });
        })
      );

      // Create payout for under_writer if there are unsold shares
      let underWriterPayout = null;
      if (availableShares > 0 && underWriterDistributable > 0) {
        underWriterPayout = await transaction.payout.create({
          data: {
            userId: underWriter.id,
            propertyId: distribution.propertyId,
            distributionId: distribution.id,
            rentalStatementId: distribution.rentalStatementId,
            sharesAtRecord: availableShares,
            amount: underWriterDistributable,
            status: "PENDING",
            notes: `System payout for ${availableShares} unsold shares (${(unsoldSharesPercentage * 100).toFixed(2)}% of total shares)`,
          },
        });
      }

      return {
        payouts: [...investorPayouts, ...(underWriterPayout ? [underWriterPayout] : [])],
      };
    } else {
      // If not in a transaction, wrap in one
      return prisma.$transaction(async (transaction) => {
        // Get distribution
        const distribution = await transaction.distribution.findUnique({
          where: { id: distributionId },
          include: {
            rentalStatement: {
              include: {
                property: true,
              },
            },
          },
        });

        if (!distribution) {
          throw new Error("Distribution not found");
        }

        if (distribution.status !== DistributionStatus.DRAFT) {
          throw new Error("Can only recalculate payouts for DRAFT distributions");
        }

        const property = distribution.rentalStatement.property;
        
        // Get all confirmed investments first
        const investments = await transaction.investment.findMany({
          where: {
            propertyId: distribution.propertyId,
            status: "CONFIRMED",
          },
        });

        const totalShares = property.totalShares;
        // Calculate sold shares from actual confirmed investments (more accurate than stored value)
        const soldShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
        const availableShares = totalShares - soldShares; // Calculate dynamically

        // Delete existing payouts for this distribution
        await transaction.payout.deleteMany({
          where: { distributionId },
        });

        // Calculate new payouts
        const soldSharesPercentage = soldShares / totalShares;
        const unsoldSharesPercentage = availableShares / totalShares;

        const investorDistributable = newNetDistributable * soldSharesPercentage;
        const underWriterDistributable = newNetDistributable * unsoldSharesPercentage;

        // Get or create under_writer system user
        const underWriter = await SystemUserService.getOrCreateUnderWriter(transaction);

        // Create payouts for each investor
        const investorPayouts = await Promise.all(
          investments.map(async (investment) => {
            const userShares = investment.shares;
            const payoutAmount = (userShares / totalShares) * newNetDistributable;

            return transaction.payout.create({
              data: {
                userId: investment.userId,
                propertyId: distribution.propertyId,
                distributionId: distribution.id,
                rentalStatementId: distribution.rentalStatementId,
                sharesAtRecord: userShares,
                amount: payoutAmount,
                status: "PENDING",
              },
            });
          })
        );

        // Create payout for under_writer if there are unsold shares
        let underWriterPayout = null;
        if (availableShares > 0 && underWriterDistributable > 0) {
          underWriterPayout = await transaction.payout.create({
            data: {
              userId: underWriter.id,
              propertyId: distribution.propertyId,
              distributionId: distribution.id,
              rentalStatementId: distribution.rentalStatementId,
              sharesAtRecord: availableShares,
              amount: underWriterDistributable,
              status: "PENDING",
              notes: `System payout for ${availableShares} unsold shares (${(unsoldSharesPercentage * 100).toFixed(2)}% of total shares)`,
            },
          });
        }

        return {
          payouts: [...investorPayouts, ...(underWriterPayout ? [underWriterPayout] : [])],
        };
      });
    }
  }

  /**
   * Submit distribution for approval
   */
  static async submitForApproval(distributionId: string) {
    return prisma.distribution.update({
      where: { id: distributionId },
      data: { status: DistributionStatus.PENDING_APPROVAL },
    });
  }

  /**
   * Approve distribution
   */
  static async approveDistribution(distributionId: string, approvedBy: string, notes?: string) {
    return prisma.distribution.update({
      where: { id: distributionId },
      data: {
        status: DistributionStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
        notes,
      },
    });
  }

  /**
   * Reject distribution (back to DRAFT)
   */
  static async rejectDistribution(distributionId: string, notes?: string) {
    return prisma.distribution.update({
      where: { id: distributionId },
      data: {
        status: DistributionStatus.DRAFT,
        notes,
      },
    });
  }

  /**
   * Declare distribution (after approval)
   * Creates transaction records for all payouts
   */
  static async declareDistribution(distributionId: string) {
    return prisma.$transaction(async (tx) => {
      // Get distribution
      const distribution = await tx.distribution.findUnique({
        where: { id: distributionId },
        include: { payouts: true },
      });

      if (!distribution) {
        throw new Error("Distribution not found");
      }

      if (distribution.status !== DistributionStatus.APPROVED) {
        throw new Error("Distribution must be approved before declaration");
      }

      // Update distribution status and set declaredAt
      const updatedDistribution = await tx.distribution.update({
        where: { id: distributionId },
        data: {
          status: DistributionStatus.DECLARED,
          declaredAt: new Date(),
        },
      });

      // Create transaction records for all payouts
      await Promise.all(
        distribution.payouts.map(async (payout) => {
          await tx.transaction.create({
            data: {
              userId: payout.userId,
              type: TransactionType.PAYOUT,
              amount: payout.amount,
              currency: "NGN",
              reference: `PAY-${payout.id.slice(0, 8).toUpperCase()}`,
            },
          });
        })
      );

      return updatedDistribution;
    });
  }

  /**
   * Get user's distributions grouped by property
   */
  static async getUserDistributionsByProperty(userId: string) {
    const payouts = await prisma.payout.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            totalShares: true,
            availableShares: true,
          },
        },
        distribution: true,
        rentalStatement: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by property
    const byProperty = new Map<
      string,
      {
        property: any;
        payouts: typeof payouts;
        totalAmount: number;
      }
    >();

    for (const payout of payouts) {
      const propertyId = payout.propertyId;
      const existing = byProperty.get(propertyId);

      if (existing) {
        existing.payouts.push(payout);
        existing.totalAmount += Number(payout.amount);
      } else {
        byProperty.set(propertyId, {
          property: payout.property,
          payouts: [payout],
          totalAmount: Number(payout.amount),
        });
      }
    }

    return Array.from(byProperty.values());
  }

  /**
   * Get user's monthly distributions
   */
  static async getUserMonthlyDistributions(userId: string) {
    const payouts = await prisma.payout.findMany({
      where: { userId },
      include: {
        property: true,
        rentalStatement: true,
        distribution: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by month
    const byMonth = new Map<
      string,
      {
        month: string;
        payouts: typeof payouts;
        totalAmount: number;
      }
    >();

    for (const payout of payouts) {
      const monthKey = payout.rentalStatement.periodStart.toISOString().slice(0, 7); // YYYY-MM
      const existing = byMonth.get(monthKey);

      if (existing) {
        existing.payouts.push(payout);
        existing.totalAmount += Number(payout.amount);
      } else {
        byMonth.set(monthKey, {
          month: monthKey,
          payouts: [payout],
          totalAmount: Number(payout.amount),
        });
      }
    }

    return Array.from(byMonth.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  }

  /**
   * Fix existing under_writer payouts with incorrect sharesAtRecord values
   * Recalculates sharesAtRecord based on actual confirmed investments
   */
  static async fixUnderWriterPayouts(distributionId?: string) {
    return prisma.$transaction(async (tx) => {
      const underWriter = await SystemUserService.getOrCreateUnderWriter(tx);
      
      // Find all under_writer payouts (optionally filtered by distributionId)
      const whereClause: any = {
        userId: underWriter.id,
      };
      
      if (distributionId) {
        whereClause.distributionId = distributionId;
      }

      const underWriterPayouts = await tx.payout.findMany({
        where: whereClause,
        include: {
          distribution: {
            include: {
              rentalStatement: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
      });

      const fixedPayouts = [];

      for (const payout of underWriterPayouts) {
        const property = payout.distribution.rentalStatement.property;
        
        // Get all confirmed investments for this property
        const investments = await tx.investment.findMany({
          where: {
            propertyId: payout.propertyId,
            status: "CONFIRMED",
          },
        });

        const totalShares = property.totalShares;
        // Calculate sold shares from actual confirmed investments
        const soldShares = investments.reduce((sum, inv) => sum + inv.shares, 0);
        const availableShares = totalShares - soldShares; // Calculate dynamically

        // Only update if sharesAtRecord is incorrect
        if (payout.sharesAtRecord !== availableShares) {
          // Recalculate the payout amount based on correct shares
          const unsoldSharesPercentage = availableShares / totalShares;
          const netDistributable = Number(payout.distribution.rentalStatement.netDistributable);
          const correctAmount = netDistributable * unsoldSharesPercentage;

          // Only update amount if distribution is DRAFT (to avoid changing paid/approved amounts)
          const updateData: any = {
            sharesAtRecord: availableShares,
            notes: `System payout for ${availableShares} unsold shares (${(unsoldSharesPercentage * 100).toFixed(2)}% of total shares)`,
          };

          // Only update amount if distribution is DRAFT
          if (payout.distribution.status === DistributionStatus.DRAFT) {
            updateData.amount = correctAmount;
          }

          const updatedPayout = await tx.payout.update({
            where: { id: payout.id },
            data: updateData,
          });

          fixedPayouts.push({
            id: updatedPayout.id,
            oldShares: payout.sharesAtRecord,
            newShares: availableShares,
            oldAmount: Number(payout.amount),
            newAmount: payout.distribution.status === DistributionStatus.DRAFT ? correctAmount : Number(payout.amount),
            distributionStatus: payout.distribution.status,
          });
        }
      }

      return {
        fixed: fixedPayouts.length,
        payouts: fixedPayouts,
      };
    });
  }
}
