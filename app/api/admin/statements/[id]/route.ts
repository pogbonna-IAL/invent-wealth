import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";
import { DistributionStatus } from "@prisma/client";
import { calculateMonthlyBreakdown, prorateToMonthly } from "@/lib/utils/statement-pro-rating";
import { DistributionService } from "@/server/services/distribution.service";

const operatingCostItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(["GENERAL_OPERATIONS", "MARKETING", "MAINTENANCE"]).optional(),
});

const updateStatementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required").optional(),
  periodStart: z.string().min(1, "Period start is required").optional(),
  periodEnd: z.string().min(1, "Period end is required").optional(),
  grossRevenue: z.number().positive().optional(),
  operatingCosts: z.number().min(0).optional(),
  operatingCostItems: z.array(operatingCostItemSchema).optional(),
  managementFee: z.number().min(0).optional(),
  managementFeePct: z.number().min(0).max(100).optional(),
  incomeAdjustment: z.number().optional(),
  occupancyRatePct: z.number().min(0).max(100).optional(),
  adr: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const { id } = await params;
    const body = await request.json();
    const validated = updateStatementSchema.parse(body);

    // Get existing statement with distributions
    const existingStatement = await prisma.rentalStatement.findUnique({
      where: { id },
      include: {
        distributions: {
          select: {
            id: true,
            status: true,
            totalDistributed: true,
          },
        },
      },
    });

    if (!existingStatement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    // Check if statement has distributions beyond DRAFT status
    const hasNonDraftDistribution = existingStatement.distributions.some(
      (d) => d.status !== DistributionStatus.DRAFT
    );

    if (hasNonDraftDistribution) {
      return NextResponse.json(
        {
          error:
            "Cannot edit statement with distributions beyond DRAFT status. Please contact system administrator.",
          distributions: existingStatement.distributions,
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Note: propertyId should not be changed when editing a statement
    // If it needs to change, the statement should be deleted and recreated
    // So we don't include propertyId in the update data
    
    if (validated.periodStart !== undefined) {
      updateData.periodStart = new Date(validated.periodStart);
    }
    if (validated.periodEnd !== undefined) {
      updateData.periodEnd = new Date(validated.periodEnd);
    }
    if (validated.grossRevenue !== undefined) {
      updateData.grossRevenue = validated.grossRevenue;
    }
    if (validated.operatingCosts !== undefined) {
      updateData.operatingCosts = validated.operatingCosts;
    }
    if (validated.operatingCostItems !== undefined) {
      // Handle pro-rating if period spans multiple months
      const periodStart = validated.periodStart
        ? new Date(validated.periodStart)
        : existingStatement.periodStart;
      const periodEnd = validated.periodEnd
        ? new Date(validated.periodEnd)
        : existingStatement.periodEnd;

      const startMonth = periodStart.getMonth();
      const endMonth = periodEnd.getMonth();
      const startYear = periodStart.getFullYear();
      const endYear = periodEnd.getFullYear();

      const spansMultipleMonths =
        startYear !== endYear ||
        startMonth !== endMonth ||
        (startYear === endYear &&
          startMonth === endMonth &&
          (periodStart.getDate() !== 1 ||
            periodEnd.getDate() !== new Date(endYear, endMonth + 1, 0).getDate()));

      if (spansMultipleMonths && validated.operatingCostItems.length > 0) {
        const monthlyBreakdown = calculateMonthlyBreakdown(periodStart, periodEnd);
        const proratedOperatingCostItems = validated.operatingCostItems.map((item) => {
          const { monthlyAmount } = prorateToMonthly(item.amount, periodStart, periodEnd);
          return {
            ...item,
            originalAmount: item.amount,
            monthlyAmount: Math.round(monthlyAmount * 100) / 100,
            breakdown: monthlyBreakdown,
          };
        });
        updateData.operatingCostItems = proratedOperatingCostItems;
      } else {
        updateData.operatingCostItems = validated.operatingCostItems;
      }
    }
    if (validated.managementFee !== undefined) {
      updateData.managementFee = validated.managementFee;
    }
    if (validated.incomeAdjustment !== undefined) {
      updateData.incomeAdjustment = validated.incomeAdjustment;
    }
    if (validated.occupancyRatePct !== undefined) {
      updateData.occupancyRatePct = validated.occupancyRatePct;
    }
    if (validated.adr !== undefined) {
      updateData.adr = validated.adr;
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes || null;
    }

    // Calculate new net distributable
    const grossRevenue =
      validated.grossRevenue ?? Number(existingStatement.grossRevenue);
    const operatingCosts =
      validated.operatingCosts ?? Number(existingStatement.operatingCosts);
    const managementFee =
      validated.managementFee ?? Number(existingStatement.managementFee);
    const incomeAdjustment =
      validated.incomeAdjustment ?? Number(existingStatement.incomeAdjustment ?? 0);

    const netDistributable =
      grossRevenue - operatingCosts - managementFee + incomeAdjustment;
    updateData.netDistributable = netDistributable;

    // Update statement and recalculate distributions if they exist
    const updatedStatement = await prisma.$transaction(async (tx) => {
      // Update statement
      const statement = await tx.rentalStatement.update({
        where: { id },
        data: updateData,
      });

      // If distributions exist and are in DRAFT status, update them
      if (existingStatement.distributions.length > 0) {
        for (const distribution of existingStatement.distributions) {
          if (distribution.status === DistributionStatus.DRAFT) {
            // Update distribution totalDistributed
            await tx.distribution.update({
              where: { id: distribution.id },
              data: {
                totalDistributed: netDistributable,
              },
            });

            // Recalculate payouts
            await DistributionService.recalculateDistributionPayouts(
              distribution.id,
              netDistributable,
              tx
            );
          }
        }
      }

      return statement;
    });

    return NextResponse.json({
      success: true,
      statement: updatedStatement,
      distributionsUpdated: existingStatement.distributions.filter(
        (d) => d.status === DistributionStatus.DRAFT
      ).length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update statement error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update statement",
      },
      { status: 500 }
    );
  }
}

