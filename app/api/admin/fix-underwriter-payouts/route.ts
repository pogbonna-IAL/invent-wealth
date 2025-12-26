import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { DistributionService } from "@/server/services/distribution.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const body = await request.json();
    const { distributionId } = body;

    const result = await DistributionService.fixUnderWriterPayouts(distributionId);

    return NextResponse.json({
      success: true,
      message: `Fixed ${result.fixed} under_writer payout(s)`,
      fixed: result.fixed,
      payouts: result.payouts,
    });
  } catch (error) {
    console.error("Fix under_writer payouts error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fix under_writer payouts",
      },
      { status: 500 }
    );
  }
}

