"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrencyNGN } from "@/lib/utils/currency";
// Property type is defined inline in the component props

const investmentSchema = z.object({
  shares: z
    .number()
    .min(1, "Must purchase at least 1 share")
    .int("Must be a whole number"),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentFormProps {
  property: {
    id: string;
    slug: string;
    pricePerShare: number | string;
    minShares: number;
    availableShares: number;
    userTotalShares?: number | null;
  };
}

export function InvestmentForm({ property }: InvestmentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Note: Onboarding check is handled server-side in the API route
  // This component should only be rendered if onboarding is complete

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      shares: property.minShares,
    },
  });

  const shares = watch("shares");
  const pricePerShare = Number(property.pricePerShare);
  const totalAmount = shares ? shares * pricePerShare : 0;

  const onSubmit = async (data: InvestmentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (data.shares < property.minShares) {
        setError(`Minimum investment is ${property.minShares} shares`);
        setIsLoading(false);
        return;
      }

      if (data.shares > property.availableShares) {
        setError(`Only ${property.availableShares} shares available`);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: property.id,
          shares: data.shares,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Investment failed");
      }

      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shares">Number of Shares</Label>
        <Input
          id="shares"
          type="number"
          min={property.minShares}
          max={property.availableShares}
          step="1"
          {...register("shares", { valueAsNumber: true })}
        />
        {errors.shares && (
          <p className="text-sm text-destructive">{errors.shares.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Start from {property.minShares.toLocaleString()} shares • Available:{" "}
          {property.availableShares.toLocaleString()} shares
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price per share</span>
          <span className="font-semibold">{formatCurrencyNGN(pricePerShare, "NGN")}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold">Total Amount</span>
          <span className="text-2xl font-bold">
            {formatCurrencyNGN(totalAmount, "NGN")}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Processing..." : "Invest Now"}
      </Button>
    </form>
  );
}

