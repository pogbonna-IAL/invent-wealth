"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { InvestmentStatus, PropertyStatus, TransactionType } from "@prisma/client";
import { z } from "zod";

const createBackdatedInvestmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  propertyId: z.string().min(1, "Property ID is required"),
  shares: z.number().int().positive("Shares must be a positive integer"),
  investmentDate: z.string().min(1, "Investment date is required"), // ISO date string
  skipPropertyUpdate: z.boolean().optional(), // Allow bypassing property status checks for backdating
});

export async function createBackdatedInvestment(
  data: z.infer<typeof createBackdatedInvestmentSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = createBackdatedInvestmentSchema.parse(data);

    // Use Prisma transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { id: validated.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get property details
      const property = await tx.property.findUnique({
        where: { id: validated.propertyId },
      });

      if (!property) {
        throw new Error("Property not found");
      }

      // For backdating, we may need to bypass some validations
      if (!validated.skipPropertyUpdate) {
        if (property.status !== PropertyStatus.OPEN && property.status !== PropertyStatus.FUNDED) {
          throw new Error("Property is not open for investment");
        }

        if (validated.shares < property.minShares) {
          throw new Error(`Minimum investment is ${property.minShares} shares`);
        }

        // Check available shares (but allow override for backdating)
        if (validated.shares > property.availableShares) {
          throw new Error(
            `Only ${property.availableShares.toLocaleString()} shares available`
          );
        }
      }

      const investmentDate = new Date(validated.investmentDate);
      const totalAmount = Number(property.pricePerShare) * validated.shares;

      // Create investment record with backdated createdAt
      const investment = await tx.investment.create({
        data: {
          userId: validated.userId,
          propertyId: validated.propertyId,
          shares: validated.shares,
          pricePerShareAtPurchase: property.pricePerShare,
          totalAmount,
          status: InvestmentStatus.CONFIRMED,
          createdAt: investmentDate,
          updatedAt: investmentDate,
        },
      });

      // Update property available shares if not skipping
      if (!validated.skipPropertyUpdate) {
        const newAvailableShares = property.availableShares - validated.shares;
        const newStatus =
          newAvailableShares <= 0 ? PropertyStatus.FUNDED : PropertyStatus.OPEN;

        await tx.property.update({
          where: { id: validated.propertyId },
          data: {
            availableShares: newAvailableShares,
            status: newStatus,
          },
        });
      }

      // Create transaction record with backdated date
      await tx.transaction.create({
        data: {
          userId: validated.userId,
          type: TransactionType.INVESTMENT,
          amount: totalAmount,
          currency: "NGN",
          reference: `INV-${investment.id.slice(0, 8).toUpperCase()}`,
          createdAt: investmentDate,
        },
      });

      return { success: true, investmentId: investment.id };
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Create backdated investment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create investment",
    };
  }
}

const updateInvestmentSchema = z.object({
  id: z.string().min(1, "Investment ID is required"),
  shares: z.number().int().positive("Shares must be a positive integer").optional(),
  totalAmount: z.number().positive("Amount must be positive").optional(),
  status: z.nativeEnum(InvestmentStatus).optional(),
  createdAt: z.string().optional(), // ISO date string for backdating
  skipPropertyUpdate: z.boolean().optional(), // Skip property share recalculation
});

export async function updateInvestment(data: z.infer<typeof updateInvestmentSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = updateInvestmentSchema.parse(data);
    
    return await prisma.$transaction(async (tx) => {
      // Get existing investment
      const existing = await tx.investment.findUnique({
        where: { id: validated.id },
        include: { property: true },
      });

      if (!existing) {
        throw new Error("Investment not found");
      }

      const updateData: any = {};
      
      // Update shares if provided
      if (validated.shares !== undefined) {
        updateData.shares = validated.shares;
        // Recalculate totalAmount if shares changed and totalAmount not provided
        if (validated.totalAmount === undefined) {
          updateData.totalAmount = validated.shares * Number(existing.pricePerShareAtPurchase);
        }
      }

      // Update totalAmount if provided
      if (validated.totalAmount !== undefined) {
        updateData.totalAmount = validated.totalAmount;
      }

      // Update status if provided
      if (validated.status !== undefined) {
        updateData.status = validated.status;
      }

      // Update createdAt if provided
      if (validated.createdAt) {
        updateData.createdAt = new Date(validated.createdAt);
        updateData.updatedAt = new Date(validated.createdAt);
      }

      // Update investment
      const investment = await tx.investment.update({
        where: { id: validated.id },
        data: updateData,
      });

      // Update property available shares if shares changed and not skipping
      if (validated.shares !== undefined && !validated.skipPropertyUpdate) {
        const shareDifference = validated.shares - existing.shares;
        const newAvailableShares = existing.property.availableShares - shareDifference;
        
        await tx.property.update({
          where: { id: existing.propertyId },
          data: {
            availableShares: Math.max(0, newAvailableShares),
            status: newAvailableShares <= 0 ? PropertyStatus.FUNDED : PropertyStatus.OPEN,
          },
        });
      }

      return { success: true, investment };
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Update investment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update investment",
    };
  }
}

const deleteInvestmentSchema = z.object({
  investmentId: z.string().min(1, "Investment ID is required"),
  reason: z.string().optional(), // Reason for deletion
});

export async function deleteInvestment(data: z.infer<typeof deleteInvestmentSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = deleteInvestmentSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      // Get investment with related data
      const investment = await tx.investment.findUnique({
        where: { id: validated.investmentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          property: true,
        },
      });

      if (!investment) {
        throw new Error("Investment not found");
      }

      // Check if investment has associated payouts (should not delete if it does)
      const payouts = await tx.payout.findMany({
        where: {
          userId: investment.userId,
          propertyId: investment.propertyId,
        },
      });

      if (payouts.length > 0) {
        return {
          success: false,
          error: "Cannot delete investment with associated payouts. Cancel the investment instead.",
        };
      }

      // Delete associated transaction if exists
      await tx.transaction.deleteMany({
        where: {
          userId: investment.userId,
          reference: { contains: investment.id.slice(0, 8).toUpperCase() },
        },
      });

      // Restore property shares if investment was CONFIRMED
      if (investment.status === "CONFIRMED") {
        await tx.property.update({
          where: { id: investment.propertyId },
          data: {
            availableShares: {
              increment: investment.shares,
            },
            status:
              investment.property.status === "FUNDED" ? "OPEN" : investment.property.status,
          },
        });
      }

      // Delete the investment
      await tx.investment.delete({
        where: { id: validated.investmentId },
      });

      // Log deletion in audit log
      try {
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "DELETE_INVESTMENT",
            metadata: {
              investmentId: validated.investmentId,
              userId: investment.userId,
              userName: investment.user.name || investment.user.email,
              propertyId: investment.propertyId,
              propertyName: investment.property.name,
              shares: investment.shares,
              amount: Number(investment.totalAmount),
              status: investment.status,
              reason: validated.reason,
            },
          },
        });
      } catch (auditError) {
        // Don't fail the deletion if audit logging fails
        console.error("Failed to log investment deletion:", auditError);
      }

      return { success: true };
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Delete investment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete investment",
    };
  }
}

