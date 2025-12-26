import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Check if onboarding is already completed
  const onboarding = await prisma.onboarding.findUnique({
    where: { userId: session.user.id },
  });

  if (onboarding?.status === "COMPLETED") {
    redirect("/dashboard");
  }

  // Get user profile for pre-filling
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <OnboardingWizard
          initialProfile={profile}
          initialOnboarding={onboarding}
          userEmail={user?.email || ""}
          userName={user?.name || ""}
        />
      </div>
    </div>
  );
}

