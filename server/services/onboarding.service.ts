import { prisma } from "@/server/db/prisma";

export class OnboardingService {
  /**
   * Check if user has completed onboarding
   */
  static async isOnboardingComplete(userId: string): Promise<boolean> {
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
    });

    return onboarding?.status === "COMPLETED";
  }

  /**
   * Get onboarding status
   */
  static async getOnboardingStatus(userId: string) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return onboarding;
  }
}

