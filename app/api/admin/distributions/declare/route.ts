import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { DistributionService } from "@/server/services/distribution.service";
import { DistributionStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const declareDistributionSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  rentalStatementId: z.string().min(1, "Rental statement ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const body = await request.json();
    const { propertyId, rentalStatementId } = declareDistributionSchema.parse(body);

    // Check if distribution already exists for this rental statement
    const existingDistribution = await prisma.distribution.findFirst({
      where: { rentalStatementId },
    });

    if (existingDistribution) {
      return NextResponse.json(
        { error: "A distribution already exists for this rental statement" },
        { status: 400 }
      );
    }

    // Create draft distribution and payouts
    const draftResult = await DistributionService.createDraftDistribution(
      propertyId,
      rentalStatementId
    );

    // Mark distribution as DECLARED (skip approval flow for direct declaration)
    const declaredDistribution = await prisma.distribution.update({
      where: { id: draftResult.distribution.id },
      data: {
        status: DistributionStatus.DECLARED,
        declaredAt: new Date(),
      },
    });

    // Create transaction records for all payouts
    await Promise.all(
      draftResult.payouts.map(async (payout) => {
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

    const result = {
      distribution: declaredDistribution,
      payouts: draftResult.payouts,
    };

    return NextResponse.json({
      success: true,
      distribution: result.distribution,
      payoutsCreated: result.payouts.length,
      message: `Distribution declared successfully. ${result.payouts.length} payouts created.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Distribution declaration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to declare distribution",
      },
      { status: 500 }
    );
  }
}

