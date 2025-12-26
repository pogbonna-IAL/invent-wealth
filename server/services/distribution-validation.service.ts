import { prisma } from "@/server/db/prisma";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DistributionValidationService {
  /**
   * Validate distribution before declaration
   */
  static async validateDistribution(distributionId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const distribution = await prisma.distribution.findUnique({
      where: { id: distributionId },
      include: {
        property: true,
        rentalStatement: true,
        payouts: {
          include: {
            user: {
              include: {
                onboarding: true,
              },
            },
          },
        },
      },
    });

    if (!distribution) {
      return {
        isValid: false,
        errors: ["Distribution not found"],
        warnings: [],
      };
    }

    // Check if property has investors
    if (distribution.payouts.length === 0) {
      errors.push("No investors found for this property");
    }

    // Check if all investors are KYC approved
    const unverifiedInvestors = distribution.payouts.filter(
      (p) => p.user.onboarding?.kycStatus !== "APPROVED"
    );
    if (unverifiedInvestors.length > 0) {
      warnings.push(
        `${unverifiedInvestors.length} investor(s) are not KYC approved`
      );
    }

    // Check if net distributable is positive
    if (Number(distribution.rentalStatement.netDistributable) <= 0) {
      errors.push("Net distributable amount must be positive");
    }

    // Check if total distributed matches sum of payouts
    const totalPayouts = distribution.payouts.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const netDistributable = Number(distribution.rentalStatement.netDistributable);
    const difference = Math.abs(totalPayouts - netDistributable);

    if (difference > 0.01) {
      // Allow small rounding differences
      warnings.push(
        `Total payouts (${totalPayouts.toFixed(2)}) doesn't match net distributable (${netDistributable.toFixed(2)})`
      );
    }

    // Check if rental statement period is valid
    if (
      distribution.rentalStatement.periodStart >= distribution.rentalStatement.periodEnd
    ) {
      errors.push("Rental statement period is invalid (start date must be before end date)");
    }

    // Check if distribution is in correct status
    if (distribution.status !== "APPROVED") {
      errors.push(`Distribution must be APPROVED before declaration. Current status: ${distribution.status}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate payout before marking as paid
   */
  static async validatePayout(payoutId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: {
          include: {
            onboarding: true,
            profile: true,
          },
        },
        distribution: true,
      },
    });

    if (!payout) {
      return {
        isValid: false,
        errors: ["Payout not found"],
        warnings: [],
      };
    }

    // Check if user is KYC approved
    if (payout.user.onboarding?.kycStatus !== "APPROVED") {
      warnings.push("User is not KYC approved");
    }

    // Check if distribution is declared
    if (payout.distribution.status !== "DECLARED" && payout.distribution.status !== "PAID") {
      errors.push("Distribution must be declared before marking payouts as paid");
    }

    // Check if payout amount is positive
    if (Number(payout.amount) <= 0) {
      errors.push("Payout amount must be positive");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

