"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createInvestment } from "@/app/actions/investment";
import Link from "next/link";
import { formatCurrencyNGN } from "@/lib/utils/currency";

interface InvestmentFlowProps {
  property: {
    id: string;
    slug: string;
    name: string;
    addressShort: string;
    city: string;
    pricePerShare: number | string;
    availableShares: number;
    minShares: number;
    totalShares: number;
    userTotalShares?: number | null;
  };
  userId: string;
}

const PLATFORM_FEE_PERCENTAGE = 2; // 2% platform fee

export function InvestmentFlow({ property, userId }: InvestmentFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shares, setShares] = useState(property.minShares);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pricePerShare is now stored in NGN, so all calculations are in NGN
  const pricePerShare = Number(property.pricePerShare);
  const subtotal = shares * pricePerShare;
  const platformFee = (subtotal * PLATFORM_FEE_PERCENTAGE) / 100;
  const totalAmount = subtotal + platformFee;

  const handleSharesChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      setShares(0);
      return;
    }

    if (numValue < property.minShares) {
      setError(`Minimum investment is ${property.minShares} shares`);
      setShares(property.minShares);
      return;
    }

    if (numValue > property.availableShares) {
      setError(`Only ${property.availableShares.toLocaleString()} shares available`);
      setShares(property.availableShares);
      return;
    }

    setError(null);
    setShares(numValue);
  };

  const handleStep1Next = () => {
    if (shares < property.minShares) {
      setError(`Minimum investment is ${property.minShares} shares`);
      return;
    }

    if (shares > property.availableShares) {
      setError(`Only ${property.availableShares.toLocaleString()} shares available`);
      return;
    }

    if (shares === 0) {
      setError("Please enter a valid number of shares");
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const handleStep2Confirm = () => {
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createInvestment({
        propertyId: property.id,
        shares,
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "Investment failed");
      }

      // Redirect to dashboard with success message
      router.push(`/dashboard?success=investment_created&investmentId=${result.investmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href={`/properties/${property.slug}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Property
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Invest in {property.name}</h1>
        <p className="text-muted-foreground">{property.addressShort}, {property.city}</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step >= 1 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
            }`}
          >
            {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
          </div>
          <span className={`text-sm ${step >= 1 ? "font-semibold" : "text-muted-foreground"}`}>
            Choose Shares
          </span>
        </div>
        <div className="flex-1 h-0.5 bg-muted mx-4" />
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step >= 2 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
            }`}
          >
            {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
          </div>
          <span className={`text-sm ${step >= 2 ? "font-semibold" : "text-muted-foreground"}`}>
            Review
          </span>
        </div>
        <div className="flex-1 h-0.5 bg-muted mx-4" />
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step >= 3 ? "bg-primary text-primary-foreground border-primary" : "border-muted"
            }`}
          >
            3
          </div>
          <span className={`text-sm ${step >= 3 ? "font-semibold" : "text-muted-foreground"}`}>
            Confirm
          </span>
        </div>
      </div>

      {/* Step 1: Choose Shares */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Number of Shares</CardTitle>
            <CardDescription>
              Select how many shares you want to purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shares">Number of Shares</Label>
              <Input
                id="shares"
                type="number"
                min={property.minShares}
                max={property.availableShares}
                step="1"
                value={shares}
                onChange={(e) => handleSharesChange(e.target.value)}
                className="text-2xl font-bold text-center"
                aria-label="Number of shares"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Minimum: {property.minShares} shares</span>
                <span>Available: {property.availableShares.toLocaleString()} shares</span>
              </div>
            </div>

            {shares > 0 && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price per share</span>
                    <span className="font-semibold">{formatCurrencyNGN(pricePerShare, "NGN")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal ({shares} shares)</span>
                    <span className="font-semibold">
                      {formatCurrencyNGN(subtotal, "NGN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                    <span className="font-semibold">
                      {formatCurrencyNGN(platformFee, "NGN")}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">
                      {formatCurrencyNGN(totalAmount, "NGN")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleStep1Next}
              className="w-full"
              disabled={shares < property.minShares || shares > property.availableShares}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review Breakdown */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Investment</CardTitle>
            <CardDescription>Please review the details before confirming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Property Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property</span>
                    <span className="font-medium">{property.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{property.addressShort}, {property.city}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Investment Breakdown</h3>
                <div className="space-y-2 rounded-lg border p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-semibold">{shares.toLocaleString()} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per share</span>
                    <span className="font-semibold">{formatCurrencyNGN(pricePerShare, "NGN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      {formatCurrencyNGN(subtotal, "NGN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                    <span className="font-semibold">
                      {formatCurrencyNGN(platformFee, "NGN")}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold">
                      {formatCurrencyNGN(totalAmount, "NGN")}
                    </span>
                  </div>
                </div>
              </div>

              {property.userTotalShares && property.userTotalShares > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm">
                    <strong>Note:</strong> You currently own {property.userTotalShares.toLocaleString()} shares in this property.
                    This investment will add {shares.toLocaleString()} more shares to your holdings.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handleStep2Back} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleStep2Confirm} className="flex-1">
                Confirm Investment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Investment</CardTitle>
            <CardDescription>Final confirmation to complete your investment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Invest?</h3>
              <p className="text-muted-foreground mb-4">
                You are about to invest {shares.toLocaleString()} shares in {property.name}
              </p>
              <div className="text-2xl font-bold">
                {formatCurrencyNGN(totalAmount, "NGN")}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm & Invest
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

