import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  profile: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().optional(),
    country: z.string().min(1),
    dob: z.string().min(1),
  }),
  riskAnswers: z.object({
    riskTolerance: z.string().min(1),
    investmentExperience: z.string().min(1),
    investmentGoals: z.string().min(1),
    investmentTimeframe: z.string().min(1),
    annualIncome: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile, riskAnswers } = onboardingSchema.parse(body);

    // Update user name if provided
    if (profile.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: profile.name },
      });
    }

    // Update or create profile
    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        phone: profile.phone,
        address: profile.address || null,
        country: profile.country,
        dob: profile.dob ? new Date(profile.dob) : null,
      },
      create: {
        userId: session.user.id,
        phone: profile.phone,
        address: profile.address || null,
        country: profile.country,
        dob: profile.dob ? new Date(profile.dob) : null,
      },
    });

    // Update onboarding status
    await prisma.onboarding.update({
      where: { userId: session.user.id },
      data: {
        status: "COMPLETED",
        riskAnswers: riskAnswers,
        kycStatus: "IN_REVIEW", // Start KYC review process
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Onboarding completion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

