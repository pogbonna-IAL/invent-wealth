import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { OnboardingService } from "@/server/services/onboarding.service";
import { prisma } from "@/server/db/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const isOnboardingComplete = await OnboardingService.isOnboardingComplete(
    session.user.id
  );

  if (!isOnboardingComplete) {
    redirect("/onboarding");
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      onboarding: true,
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <SettingsTabs user={user} />
      </div>
    </AppLayout>
  );
}

