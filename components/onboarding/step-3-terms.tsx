"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface OnboardingStep3Props {
  termsAccepted: boolean;
  riskAcknowledged: boolean;
  onTermsChange: (accepted: boolean) => void;
  onRiskChange: (acknowledged: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function OnboardingStep3({
  termsAccepted,
  riskAcknowledged,
  onTermsChange,
  onRiskChange,
  onSubmit,
  onBack,
  isSubmitting,
}: OnboardingStep3Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!termsAccepted) {
      newErrors.terms = "You must accept the terms of service";
    }
    if (!riskAcknowledged) {
      newErrors.risk = "You must acknowledge the investment risks";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => onTermsChange(checked === true)}
                className="mt-1 focus-visible:ring-2"
                aria-label="Accept terms of service"
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? "terms-error" : undefined}
              />
              <div className="flex-1">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I have read and accept the{" "}
                  <Link
                    href="/legal/terms"
                    target="_blank"
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Privacy Policy
                  </Link>
                  <span className="text-destructive">*</span>
                </Label>
                {errors.terms && (
                  <p id="terms-error" className="text-sm text-destructive mt-1" role="alert">
                    {errors.terms}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-destructive/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-destructive mb-2">
                  Investment Risk Acknowledgment
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">Important:</strong> By investing through
                    InventWealth, you acknowledge that:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All investments carry risk of loss</li>
                    <li>You may lose some or all of your investment</li>
                    <li>Property values can fluctuate</li>
                    <li>Rental income may vary and is not guaranteed</li>
                    <li>Past performance does not guarantee future results</li>
                    <li>There are no guarantees of returns</li>
                    <li>You should only invest what you can afford to lose</li>
                  </ul>
                  <p className="mt-3">
                    You understand that fractional property ownership involves risks including but
                    not limited to market risk, property-specific risk, liquidity risk, and
                    operational risk.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2 border-t">
                <Checkbox
                  id="risk"
                  checked={riskAcknowledged}
                  onCheckedChange={(checked) => onRiskChange(checked === true)}
                  className="mt-1 focus-visible:ring-2"
                  aria-label="Acknowledge investment risks"
                  aria-invalid={!!errors.risk}
                  aria-describedby={errors.risk ? "risk-error" : undefined}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="risk"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I understand and acknowledge the investment risks described above
                    <span className="text-destructive">*</span>
                  </Label>
                  {errors.risk && (
                    <p id="risk-error" className="text-sm text-destructive mt-1" role="alert">
                      {errors.risk}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="focus-visible:ring-2"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!termsAccepted || !riskAcknowledged || isSubmitting}
          className="focus-visible:ring-2"
        >
          {isSubmitting ? "Completing..." : "Complete Onboarding"}
        </Button>
      </div>
    </form>
  );
}

