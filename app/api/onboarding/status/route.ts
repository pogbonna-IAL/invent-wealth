import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { OnboardingService } from "@/server/services/onboarding.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ completed: false }, { status: 401 });
    }

    const completed = await OnboardingService.isOnboardingComplete(session.user.id);

    return NextResponse.json({ completed });
  } catch (error) {
    console.error("Onboarding status check error:", error);
    return NextResponse.json({ completed: false }, { status: 500 });
  }
}

