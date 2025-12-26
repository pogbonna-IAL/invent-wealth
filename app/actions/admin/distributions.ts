"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { DistributionService } from "@/server/services/distribution.service";
import { PushNotificationService } from "@/server/services/push-notification.service";
import { prisma } from "@/server/db/prisma";
import { DistributionStatus, PayoutStatus, TransactionType } from "@prisma/client";
import { z } from "zod";
import { formatCurrencyNGN } from "@/lib/utils/currency";

const deleteDistributionSchema = z.object({
  distributionId: z.string().min(1),
  reason: z.string().optional(),
});

const submitDistributionForApprovalSchema = z.object({
  distributionId: z.string().min(1),
});

const approveDistributionSchema = z.object({
  distributionId: z.string().min(1),
  notes: z.string().optional(),
});

const rejectDistributionSchema = z.object({
  distributionId: z.string().min(1),
  notes: z.string().optional(),
});

const declareDistributionSchema = z.object({
  distributionId: z.string().min(1),
});

const declareDistributionFromStatementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  rentalStatementId: z.string().min(1, "Rental statement ID is required"),
});

const createDraftDistributionSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  rentalStatementId: z.string().min(1, "Rental statement ID is required"),
});

export async function createDraftDistribution(
  data: z.infer<typeof createDraftDistributionSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { propertyId, rentalStatementId } = createDraftDistributionSchema.parse(data);

    // Check if distribution already exists for this rental statement
    const existingDistribution = await prisma.distribution.findFirst({
      where: { rentalStatementId },
    });

    if (existingDistribution) {
      return {
        success: false,
        error: "A distribution already exists for this rental statement",
      };
    }

    // Create draft distribution and payouts
    const result = await DistributionService.createDraftDistribution(
      propertyId,
      rentalStatementId
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DRAFT_DISTRIBUTION_CREATED",
        metadata: {
          distributionId: result.distribution.id,
          propertyId,
          rentalStatementId,
          totalDistributed: Number(result.distribution.totalDistributed),
          payoutsCreated: result.payouts.length,
        },
      },
    });

    return {
      success: true,
      distributionId: result.distribution.id,
      payoutsCreated: result.payouts.length,
      message: `Draft distribution created successfully. ${result.payouts.length} payouts created.`,
    };
  } catch (error) {
    console.error("Create draft distribution error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create draft distribution",
    };
  }
}

export async function declareDistributionFromStatement(
  data: z.infer<typeof declareDistributionFromStatementSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { propertyId, rentalStatementId } = declareDistributionFromStatementSchema.parse(data);

    // Check if distribution already exists for this rental statement
    const existingDistribution = await prisma.distribution.findFirst({
      where: { rentalStatementId },
    });

    if (existingDistribution) {
      return {
        success: false,
        error: "A distribution already exists for this rental statement",
      };
    }

    // Create draft distribution and payouts
    const result = await DistributionService.createDraftDistribution(
      propertyId,
      rentalStatementId
    );

    // Mark distribution as DECLARED (skip approval flow for direct declaration)
    const declaredDistribution = await prisma.distribution.update({
      where: { id: result.distribution.id },
      data: {
        status: DistributionStatus.DECLARED,
        declaredAt: new Date(),
      },
    });

    // Create transaction records for all payouts
    await Promise.all(
      result.payouts.map(async (payout) => {
        await prisma.transaction.create({
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

    // Get property info for notification
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { name: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DISTRIBUTION_DECLARED",
        metadata: {
          distributionId: declaredDistribution.id,
          propertyId,
          rentalStatementId,
          totalDistributed: Number(declaredDistribution.totalDistributed),
          payoutsCreated: result.payouts.length,
        },
      },
    });

    // Send push notifications to all users with payouts
    const userIds = [...new Set(result.payouts.map((p) => p.userId))];
    if (userIds.length > 0) {
      try {
        await PushNotificationService.sendToUsers(userIds, {
          title: "New Distribution Declared",
          body: `A new distribution has been declared for ${property?.name || "your property"}. Total: ${formatCurrencyNGN(Number(declaredDistribution.totalDistributed))}`,
          icon: "/invent-alliance-logo-small.svg",
          badge: "/invent-alliance-logo-small.svg",
          tag: `distribution-${declaredDistribution.id}`,
          data: {
            url: "/income",
            distributionId: declaredDistribution.id,
            propertyId,
          },
          requireInteraction: false,
        });
      } catch (pushError) {
        // Don't fail the distribution declaration if push notifications fail
        console.error("Failed to send push notifications:", pushError);
      }
    }

    return {
      success: true,
      distribution: declaredDistribution,
      payoutsCreated: result.payouts.length,
      message: `Distribution declared successfully. ${result.payouts.length} payouts created.`,
    };
  } catch (error) {
    console.error("Declare distribution from statement error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to declare distribution from statement",
    };
  }
}

export async function submitDistributionForApproval(
  data: z.infer<typeof submitDistributionForApprovalSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId } = submitDistributionForApprovalSchema.parse(data);

    await DistributionService.submitForApproval(distributionId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DISTRIBUTION_SUBMITTED_FOR_APPROVAL",
        metadata: {
          distributionId,
        },
      },
    });

    return {
      success: true,
      message: "Distribution submitted for approval",
    };
  } catch (error) {
    console.error("Submit distribution for approval error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit distribution for approval",
    };
  }
}

export async function approveDistribution(
  data: z.infer<typeof approveDistributionSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId, notes } = approveDistributionSchema.parse(data);

    await DistributionService.approveDistribution(
      distributionId,
      session.user.id,
      notes
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DISTRIBUTION_APPROVED",
        metadata: {
          distributionId,
          notes,
        },
      },
    });

    return {
      success: true,
      message: "Distribution approved successfully",
    };
  } catch (error) {
    console.error("Approve distribution error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to approve distribution",
    };
  }
}

export async function rejectDistribution(
  data: z.infer<typeof rejectDistributionSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId, notes } = rejectDistributionSchema.parse(data);

    await DistributionService.rejectDistribution(distributionId, notes);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DISTRIBUTION_REJECTED",
        metadata: {
          distributionId,
          notes,
        },
      },
    });

    return {
      success: true,
      message: "Distribution rejected and returned to draft",
    };
  } catch (error) {
    console.error("Reject distribution error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reject distribution",
    };
  }
}

export async function declareDistribution(
  data: z.infer<typeof declareDistributionSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId } = declareDistributionSchema.parse(data);

    await DistributionService.declareDistribution(distributionId);

    // Get distribution with payouts and property info
    const distribution = await prisma.distribution.findUnique({
      where: { id: distributionId },
      include: {
        payouts: {
          select: { userId: true },
        },
        property: {
          select: { name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DISTRIBUTION_DECLARED",
        metadata: {
          distributionId,
        },
      },
    });

    // Send push notifications to all users with payouts
    if (distribution && distribution.payouts.length > 0) {
      const userIds = [...new Set(distribution.payouts.map((p) => p.userId))];
      try {
        await PushNotificationService.sendToUsers(userIds, {
          title: "New Distribution Declared",
          body: `A new distribution has been declared for ${distribution.property.name}. Total: ${formatCurrencyNGN(Number(distribution.totalDistributed))}`,
          icon: "/invent-alliance-logo-small.svg",
          badge: "/invent-alliance-logo-small.svg",
          tag: `distribution-${distributionId}`,
          data: {
            url: "/income",
            distributionId,
            propertyId: distribution.propertyId,
          },
          requireInteraction: false,
        });
      } catch (pushError) {
        // Don't fail the distribution declaration if push notifications fail
        console.error("Failed to send push notifications:", pushError);
      }
    }

    return {
      success: true,
      message: "Distribution declared successfully",
    };
  } catch (error) {
    console.error("Declare distribution error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to declare distribution",
    };
  }
}

const fixUnderWriterPayoutsSchema = z.object({
  distributionId: z.string().optional(),
});

export async function fixUnderWriterPayouts(
  data: z.infer<typeof fixUnderWriterPayoutsSchema> = {}
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId } = fixUnderWriterPayoutsSchema.parse(data);

    const result = await DistributionService.fixUnderWriterPayouts(distributionId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UNDER_WRITER_PAYOUTS_FIXED",
        metadata: {
          distributionId: distributionId || "all",
          fixed: result.fixed,
          payouts: result.payouts,
        },
      },
    });

    return {
      success: true,
      message: `Fixed ${result.fixed} under_writer payout(s)`,
      fixed: result.fixed,
      payouts: result.payouts,
    };
  } catch (error) {
    console.error("Fix under_writer payouts error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fix under_writer payouts",
    };
  }
}

export async function deleteDistribution(data: z.infer<typeof deleteDistributionSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { distributionId, reason } = deleteDistributionSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      // Get distribution with payouts
      const distribution = await tx.distribution.findUnique({
        where: { id: distributionId },
        include: {
          payouts: true,
        },
      });

      if (!distribution) {
        throw new Error("Distribution not found");
      }

      // Validation: Only allow deletion if:
      // 1. Status is DECLARED (not PAID)
      // 2. No payouts are PAID
      if (distribution.status === DistributionStatus.PAID) {
        throw new Error("Cannot delete a distribution that has been fully paid");
      }

      const paidPayouts = distribution.payouts.filter(
        (p) => p.status === PayoutStatus.PAID
      );

      if (paidPayouts.length > 0) {
        throw new Error(
          `Cannot delete distribution: ${paidPayouts.length} payout(s) have already been paid`
        );
      }

      // Delete related transactions (created when distribution was declared)
      // Find transactions by matching payout references
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

      // Delete payouts (cascade should handle this, but explicit is better)
      await tx.payout.deleteMany({
        where: { distributionId },
      });

      // Delete distribution
      await tx.distribution.delete({
        where: { id: distributionId },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DISTRIBUTION_DELETED",
          metadata: {
            distributionId,
            reason,
            totalDistributed: Number(distribution.totalDistributed),
            payoutsDeleted: distribution.payouts.length,
          },
        },
      });

      return {
        success: true,
        message: "Distribution deleted successfully",
      };
    });
  } catch (error) {
    console.error("Delete distribution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete distribution",
    };
  }
}
