import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { DistributionService } from "@/server/services/distribution.service";
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

    // Declare distribution and create payouts
    const result = await DistributionService.declareDistribution(
      propertyId,
      rentalStatementId
    );

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

