/**
 * FX Converter Service
 * Converts between currencies using a simple rate system
 * In production, this would fetch real-time rates from an API
 */

const FX_RATES: Record<string, Record<string, number>> = {
  USD: {
    NGN: 1500, // 1 USD = 1500 NGN (approximate rate)
    USD: 1,
  },
  NGN: {
    USD: 1 / 1500,
    NGN: 1,
  },
};

export class FXService {
  /**
   * Convert amount from one currency to another
   */
  static convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = FX_RATES[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(
        `No exchange rate found for ${fromCurrency} to ${toCurrency}`
      );
    }

    return amount * rate;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(
    amount: number,
    currency: string,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    });

    // For NGN, we'll format manually since Intl.NumberFormat might not support it well
    if (currency === "NGN") {
      return `₦${amount.toLocaleString("en-US", {
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
      })}`;
    }

    return formatter.format(amount);
  }

  /**
   * Get exchange rate
   */
  static getRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rate = FX_RATES[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(
        `No exchange rate found for ${fromCurrency} to ${toCurrency}`
      );
    }

    return rate;
  }
}

