"use server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  dob: z.string().optional(),
});

export async function updateProfile(input: {
  name: string;
  phone?: string;
  address?: string;
  country?: string;
  dob?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in to update your profile",
      };
    }

    const validatedInput = profileSchema.parse(input);

    // Update user name
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validatedInput.name },
    });

    // Update or create profile
    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        phone: validatedInput.phone || null,
        address: validatedInput.address || null,
        country: validatedInput.country || null,
        dob: validatedInput.dob ? new Date(validatedInput.dob) : null,
      },
      create: {
        userId: session.user.id,
        phone: validatedInput.phone || null,
        address: validatedInput.address || null,
        country: validatedInput.country || null,
        dob: validatedInput.dob ? new Date(validatedInput.dob) : null,
      },
    });

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid input",
      };
    }

    console.error("Profile update error:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}

export async function softDeleteAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in to delete your account",
      };
    }

    // Soft delete: Update user email to mark as deleted
    // In a real app, you might add a `deletedAt` field or `isActive` flag
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: `deleted_${Date.now()}_${session.user.email}`,
        name: "Deleted User",
      },
    });

    return {
      success: true,
      message: "Account deactivated successfully",
    };
  } catch (error) {
    console.error("Account deactivation error:", error);
    return {
      success: false,
      error: "Failed to deactivate account",
    };
  }
}

export async function deleteAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in to delete your account",
      };
    }

    // Permanent delete: Delete user and all related data (cascade)
    // Note: This will cascade delete investments, payouts, transactions, etc.
    // In production, you might want to anonymize data instead of deleting
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Account deletion error:", error);
    return {
      success: false,
      error: "Failed to delete account",
    };
  }
}

