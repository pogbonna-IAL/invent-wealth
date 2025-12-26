"use server";

import { prisma } from "@/server/db/prisma";
import { UserService } from "@/server/services/user.service";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export async function signUp(data: z.infer<typeof signUpSchema>) {
  try {
    const validated = signUpSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name || validated.email.split("@")[0],
        role: "INVESTOR",
        emailVerified: new Date(), // Auto-verify for credentials signup
        profile: {
          create: {},
        },
        onboarding: {
          create: {
            status: "PENDING",
            kycStatus: "PENDING",
          },
        },
      },
    });

    // Ensure profile and onboarding are created
    await UserService.ensureUserProfile(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }

    console.error("Sign up error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create account",
    };
  }
}

