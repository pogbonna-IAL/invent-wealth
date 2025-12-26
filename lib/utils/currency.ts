/**
 * Currency formatting utilities
 * Default currency is NGN with USD as secondary
 */

import { FXService } from "@/server/services/fx.service";

export const DEFAULT_CURRENCY = "NGN";
export const SECONDARY_CURRENCY = "USD";

/**
 * Format amount in NGN only (primary display format)
 * All statement values are stored in NGN, so no conversion is needed
 */
export function formatCurrencyNGN(
  amount: number,
  storedCurrency: string = "NGN",
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options || {};

  // All statement values are already in NGN, so no conversion needed
  // Only convert if explicitly marked as USD (for backward compatibility)
  const ngnAmount =
    storedCurrency === "USD"
      ? FXService.convert(amount, "USD", "NGN")
      : amount;

  return FXService.formatCurrency(ngnAmount, "NGN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

/**
 * Format amount in primary currency (NGN) with secondary currency (USD) as fallback
 */
export function formatCurrency(
  amount: number,
  options?: {
    primaryCurrency?: string;
    secondaryCurrency?: string;
    showSecondary?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    primaryCurrency = DEFAULT_CURRENCY,
    secondaryCurrency = SECONDARY_CURRENCY,
    showSecondary = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options || {};

  // If amount is stored in USD, convert to NGN for display
  const primaryAmount =
    primaryCurrency === "NGN" ? FXService.convert(amount, "USD", "NGN") : amount;

  const formatted = FXService.formatCurrency(primaryAmount, primaryCurrency, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (showSecondary && primaryCurrency === "NGN") {
    const secondaryAmount = FXService.convert(amount, "USD", "USD");
    const formattedSecondary = FXService.formatCurrency(secondaryAmount, secondaryCurrency, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return `${formatted} / ${formattedSecondary}`;
  }

  return formatted;
}

/**
 * Format amount with both NGN and USD displayed
 * @deprecated Use formatCurrencyNGN for NGN-only display
 */
export function formatCurrencyWithSecondary(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options || {};

  // Assume amount is stored in USD, convert to NGN
  const ngnAmount = FXService.convert(amount, "USD", "NGN");
  const formattedNGN = FXService.formatCurrency(ngnAmount, "NGN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  const formattedUSD = FXService.formatCurrency(amount, "USD", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return `${formattedNGN} / ${formattedUSD}`;
}

/**
 * Format currency for display in tables and lists
 * Shows NGN as primary, USD as secondary in parentheses
 */
export function formatCurrencyDisplay(
  amount: number,
  storedCurrency: string = "USD",
  options?: {
    showSecondary?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    showSecondary = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options || {};

  // Convert to NGN if stored in USD
  const ngnAmount =
    storedCurrency === "USD"
      ? FXService.convert(amount, "USD", "NGN")
      : amount;

  const formattedNGN = FXService.formatCurrency(ngnAmount, "NGN", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (showSecondary && storedCurrency === "USD") {
    const formattedUSD = FXService.formatCurrency(amount, "USD", {
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return `${formattedNGN} (${formattedUSD})`;
  }

  return formattedNGN;
}

/**
 * Format currency for chart tooltips and axis labels
 * Shows NGN as primary, USD as secondary
 */
export function formatCurrencyForChart(
  amount: number,
  storedCurrency: string = "USD"
): string {
  // Convert to NGN if stored in USD
  const ngnAmount =
    storedCurrency === "USD"
      ? FXService.convert(amount, "USD", "NGN")
      : amount;

  const formattedNGN = FXService.formatCurrency(ngnAmount, "NGN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formattedUSD = FXService.formatCurrency(amount, "USD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${formattedNGN} (${formattedUSD})`;
}

/**
 * Format currency for chart axis labels (simplified)
 * Shows NGN only for cleaner axis labels
 */
export function formatCurrencyAxis(amount: number, storedCurrency: string = "USD"): string {
  const ngnAmount =
    storedCurrency === "USD"
      ? FXService.convert(amount, "USD", "NGN")
      : amount;

  return `₦${ngnAmount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

