"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { PasswordResetService } from "@/server/services/password-reset.service";
import { OnboardingStatus, KycStatus } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  dob: z.string().optional(), // ISO date string
  createdAt: z.string().optional(), // ISO date string for backdating
  kycStatus: z.nativeEnum(KycStatus).default(KycStatus.APPROVED),
  onboardingStatus: z.nativeEnum(OnboardingStatus).default(OnboardingStatus.COMPLETED),
  riskTolerance: z.string().optional(),
  investmentExperience: z.string().optional(),
});

export async function createUserManually(data: z.infer<typeof createUserSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = createUserSchema.parse(data);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return { success: false, error: "User with this email already exists" };
    }

    // Parse dates
    const createdAt = validated.createdAt ? new Date(validated.createdAt) : new Date();
    const dob = validated.dob ? new Date(validated.dob) : null;

    // Create user with profile and onboarding
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        role: "INVESTOR",
        emailVerified: createdAt, // Set emailVerified to createdAt for manual accounts
        createdAt,
        profile: {
          create: {
            phone: validated.phone || null,
            address: validated.address || null,
            country: validated.country || null,
            dob,
          },
        },
        onboarding: {
          create: {
            status: validated.onboardingStatus,
            kycStatus: validated.kycStatus,
            riskAnswers: validated.riskTolerance || validated.investmentExperience
              ? {
                  riskTolerance: validated.riskTolerance || "moderate",
                  investmentExperience: validated.investmentExperience || "intermediate",
                }
              : undefined,
          },
        },
      },
      include: {
        profile: true,
        onboarding: true,
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Create user error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1),
});

export async function updateUserManually(data: z.infer<typeof updateUserSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { id, ...updateData } = updateUserSchema.parse(data);

    // Parse dates
    const dob = updateData.dob ? new Date(updateData.dob) : undefined;
    const createdAt = updateData.createdAt ? new Date(updateData.createdAt) : undefined;

    // Update user
    const userUpdateData: any = {};
    if (updateData.email) userUpdateData.email = updateData.email;
    if (updateData.name) userUpdateData.name = updateData.name;
    if (createdAt) {
      userUpdateData.createdAt = createdAt;
      userUpdateData.emailVerified = createdAt; // Keep emailVerified in sync
    }

    await prisma.user.update({
      where: { id },
      data: userUpdateData,
    });

    // Update profile if provided
    if (updateData.phone !== undefined || updateData.address !== undefined || 
        updateData.country !== undefined || dob !== undefined) {
      await prisma.profile.upsert({
        where: { userId: id },
        update: {
          phone: updateData.phone || null,
          address: updateData.address || null,
          country: updateData.country || null,
          dob: dob || null,
        },
        create: {
          userId: id,
          phone: updateData.phone || null,
          address: updateData.address || null,
          country: updateData.country || null,
          dob: dob || null,
        },
      });
    }

    // Update onboarding if provided
    if (updateData.kycStatus || updateData.onboardingStatus || 
        updateData.riskTolerance || updateData.investmentExperience) {
      const onboardingData: any = {};
      if (updateData.kycStatus) onboardingData.kycStatus = updateData.kycStatus;
      if (updateData.onboardingStatus) onboardingData.status = updateData.onboardingStatus;
      
      if (updateData.riskTolerance || updateData.investmentExperience) {
        const existing = await prisma.onboarding.findUnique({ where: { userId: id } });
        const existingRiskAnswers = (existing?.riskAnswers && 
          typeof existing.riskAnswers === 'object' && 
          existing.riskAnswers !== null
        ) ? existing.riskAnswers as { riskTolerance?: string; investmentExperience?: string } : {};
        onboardingData.riskAnswers = {
          ...existingRiskAnswers,
          riskTolerance: updateData.riskTolerance || existingRiskAnswers.riskTolerance,
          investmentExperience: updateData.investmentExperience || existingRiskAnswers.investmentExperience,
        };
      }

      await prisma.onboarding.upsert({
        where: { userId: id },
        update: onboardingData,
        create: {
          userId: id,
          status: updateData.onboardingStatus || "PENDING",
          kycStatus: updateData.kycStatus || "PENDING",
          riskAnswers: onboardingData.riskAnswers || undefined,
        },
      });
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Update user error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function sendPasswordResetEmail(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    await PasswordResetService.sendPasswordResetEmail(userId, true);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PASSWORD_RESET_EMAIL_SENT",
        metadata: {
          targetUserId: userId,
          adminTriggered: true,
        },
      },
    });

    return { success: true, message: "Password reset email sent successfully" };
  } catch (error) {
    console.error("Send password reset email error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send password reset email",
    };
  }
}

