"use server";

import { auth } from "@/server/auth";
import { InvestmentService } from "@/server/services/investment.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { z } from "zod";

const investmentSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  shares: z
    .number()
    .int("Shares must be a whole number")
    .min(1, "Must purchase at least 1 share"),
});

export async function createInvestment(input: {
  propertyId: string;
  shares: number;
}) {
  try {
    // Validate input
    const validatedInput = investmentSchema.parse(input);

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be signed in to make an investment",
      };
    }

    // Check onboarding status
    const isOnboardingComplete = await OnboardingService.isOnboardingComplete(
      session.user.id
    );
    if (!isOnboardingComplete) {
      return {
        success: false,
        error: "Please complete your investor profile before making investments",
      };
    }

    // Create investment (this handles all validation and transaction safety)
    const investment = await InvestmentService.purchaseShares(
      session.user.id,
      validatedInput.propertyId,
      validatedInput.shares
    );

    return {
      success: true,
      investmentId: investment.id,
      message: "Investment created successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid input",
      };
    }

    // Handle known errors from InvestmentService
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("Investment creation error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

