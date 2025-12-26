import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";

export async function GET(
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

    const payouts = await prisma.payout.findMany({
      where: {
        distributionId: id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Serialize Decimal fields to numbers
    const serializedPayouts = payouts.map((payout) => ({
      ...payout,
      amount: Number(payout.amount),
    }));

    return NextResponse.json({ payouts: serializedPayouts });
  } catch (error) {
    console.error("Get payouts error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch payouts",
      },
      { status: 500 }
    );
  }
}

