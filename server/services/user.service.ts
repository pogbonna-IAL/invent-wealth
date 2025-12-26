import { prisma } from "@/server/db/prisma";

export class UserService {
  /**
   * Ensure user has Profile and Onboarding records
   * Called after user signs in for the first time
   */
  static async ensureUserProfile(userId: string) {
    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      await prisma.profile.create({
        data: {
          userId,
        },
      });
    }

    // Check if onboarding exists
    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      await prisma.onboarding.create({
        data: {
          userId,
          status: "PENDING",
          kycStatus: "PENDING",
        },
      });
    }

    return { profile: profile || await prisma.profile.findUnique({ where: { userId } }), onboarding: onboarding || await prisma.onboarding.findUnique({ where: { userId } }) };
  }
}

