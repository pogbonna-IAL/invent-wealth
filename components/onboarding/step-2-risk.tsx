"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface OnboardingStep2Props {
  initialData: {
    riskTolerance: string;
    investmentExperience: string;
    investmentGoals: string;
    investmentTimeframe: string;
    annualIncome: string;
  };
  onNext: (data: OnboardingStep2Props["initialData"]) => void;
  onBack: () => void;
}

const riskToleranceOptions = [
  { value: "conservative", label: "Conservative", description: "I prefer low-risk investments with stable returns" },
  { value: "moderate", label: "Moderate", description: "I'm comfortable with moderate risk for balanced returns" },
  { value: "aggressive", label: "Aggressive", description: "I'm willing to take higher risks for potentially higher returns" },
];

const experienceOptions = [
  { value: "none", label: "No experience", description: "I'm new to investing" },
  { value: "beginner", label: "Beginner", description: "I have some basic knowledge" },
  { value: "intermediate", label: "Intermediate", description: "I have moderate experience" },
  { value: "advanced", label: "Advanced", description: "I'm an experienced investor" },
];

const goalOptions = [
  { value: "income", label: "Generate Income", description: "I want regular passive income" },
  { value: "growth", label: "Long-term Growth", description: "I'm investing for future wealth" },
  { value: "diversification", label: "Portfolio Diversification", description: "I want to diversify my investments" },
  { value: "both", label: "Both Income & Growth", description: "I want both income and growth" },
];

const timeframeOptions = [
  { value: "short", label: "Less than 1 year", description: "Short-term investment" },
  { value: "medium", label: "1-5 years", description: "Medium-term investment" },
  { value: "long", label: "5+ years", description: "Long-term investment" },
];

const incomeOptions = [
  { value: "under-2m", label: "Under ₦2,000,000" },
  { value: "2m-5m", label: "₦2,000,000 - ₦5,000,000" },
  { value: "5m-10m", label: "₦5,000,000 - ₦10,000,000" },
  { value: "10m-20m", label: "₦10,000,000 - ₦20,000,000" },
  { value: "20m-50m", label: "₦20,000,000 - ₦50,000,000" },
  { value: "over-50m", label: "Over ₦50,000,000" },
];

export function OnboardingStep2({
  initialData,
  onNext,
  onBack,
}: OnboardingStep2Props) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.riskTolerance) {
      newErrors.riskTolerance = "Please select your risk tolerance";
    }
    if (!formData.investmentExperience) {
      newErrors.investmentExperience = "Please select your investment experience";
    }
    if (!formData.investmentGoals) {
      newErrors.investmentGoals = "Please select your investment goals";
    }
    if (!formData.investmentTimeframe) {
      newErrors.investmentTimeframe = "Please select your investment timeframe";
    }
    if (!formData.annualIncome) {
      newErrors.annualIncome = "Please select your annual income range";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">
            What is your risk tolerance? <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            This helps us recommend suitable investment opportunities
          </p>
          <RadioGroup
            value={formData.riskTolerance}
            onValueChange={(value) =>
              setFormData({ ...formData, riskTolerance: value })
            }
            className="space-y-3"
            aria-label="Risk tolerance"
            aria-invalid={!!errors.riskTolerance}
            aria-describedby={errors.riskTolerance ? "risk-error" : undefined}
          >
            {riskToleranceOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setFormData({ ...formData, riskTolerance: option.value })}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer font-normal"
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.riskTolerance && (
            <p id="risk-error" className="text-sm text-destructive mt-2" role="alert">
              {errors.riskTolerance}
            </p>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">
            What is your investment experience? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.investmentExperience}
            onValueChange={(value) =>
              setFormData({ ...formData, investmentExperience: value })
            }
            className="space-y-3 mt-4"
            aria-label="Investment experience"
            aria-invalid={!!errors.investmentExperience}
          >
            {experienceOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  setFormData({ ...formData, investmentExperience: option.value })
                }
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.investmentExperience && (
            <p className="text-sm text-destructive mt-2" role="alert">
              {errors.investmentExperience}
            </p>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">
            What are your investment goals? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.investmentGoals}
            onValueChange={(value) =>
              setFormData({ ...formData, investmentGoals: value })
            }
            className="space-y-3 mt-4"
            aria-label="Investment goals"
            aria-invalid={!!errors.investmentGoals}
          >
            {goalOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setFormData({ ...formData, investmentGoals: option.value })}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.investmentGoals && (
            <p className="text-sm text-destructive mt-2" role="alert">
              {errors.investmentGoals}
            </p>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">
            What is your investment timeframe? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            value={formData.investmentTimeframe}
            onValueChange={(value) =>
              setFormData({ ...formData, investmentTimeframe: value })
            }
            className="space-y-3 mt-4"
            aria-label="Investment timeframe"
            aria-invalid={!!errors.investmentTimeframe}
          >
            {timeframeOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  setFormData({ ...formData, investmentTimeframe: option.value })
                }
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.investmentTimeframe && (
            <p className="text-sm text-destructive mt-2" role="alert">
              {errors.investmentTimeframe}
            </p>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">
            What is your annual income range? <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            This helps us ensure investments are suitable for your financial situation
          </p>
          <RadioGroup
            value={formData.annualIncome}
            onValueChange={(value) =>
              setFormData({ ...formData, annualIncome: value })
            }
            className="space-y-2 mt-4"
            aria-label="Annual income range"
            aria-invalid={!!errors.annualIncome}
          >
            {incomeOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setFormData({ ...formData, annualIncome: option.value })}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {errors.annualIncome && (
            <p className="text-sm text-destructive mt-2" role="alert">
              {errors.annualIncome}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="focus-visible:ring-2">
          Back
        </Button>
        <Button type="submit" className="focus-visible:ring-2">
          Continue
        </Button>
      </div>
    </form>
  );
}

