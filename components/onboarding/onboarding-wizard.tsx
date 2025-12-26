"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep1 } from "./step-1-profile";
import { OnboardingStep2 } from "./step-2-risk";
import { OnboardingStep3 } from "./step-3-terms";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OnboardingWizardProps {
  initialProfile?: {
    phone?: string | null;
    address?: string | null;
    country?: string | null;
    dob?: Date | null;
  } | null;
  initialOnboarding?: {
    riskAnswers?: any;
  } | null;
  userEmail: string;
  userName?: string | null;
}

export function OnboardingWizard({
  initialProfile,
  initialOnboarding,
  userEmail,
  userName,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [profileData, setProfileData] = useState({
    name: userName || "",
    phone: initialProfile?.phone || "",
    address: initialProfile?.address || "",
    country: initialProfile?.country || "",
    dob: initialProfile?.dob
      ? new Date(initialProfile.dob).toISOString().split("T")[0]
      : "",
  });

  const [riskAnswers, setRiskAnswers] = useState(
    initialOnboarding?.riskAnswers || {
      riskTolerance: "",
      investmentExperience: "",
      investmentGoals: "",
      investmentTimeframe: "",
      annualIncome: "",
    }
  );

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const handleStep1Next = (data: typeof profileData) => {
    setProfileData(data);
    setCurrentStep(2);
  };

  const handleStep2Next = (data: typeof riskAnswers) => {
    setRiskAnswers(data);
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleComplete = async () => {
    if (!termsAccepted || !riskAcknowledged) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: profileData,
          riskAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground">
          We need a few details to get you started with investing
        </p>
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of 3
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Profile Information"}
            {currentStep === 2 && "Investor Suitability"}
            {currentStep === 3 && "Terms & Risk Acknowledgment"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Tell us about yourself"}
            {currentStep === 2 && "Help us understand your investment profile"}
            {currentStep === 3 && "Review and acknowledge important information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <OnboardingStep1
              initialData={profileData}
              userEmail={userEmail}
              onNext={handleStep1Next}
            />
          )}
          {currentStep === 2 && (
            <OnboardingStep2
              initialData={riskAnswers}
              onNext={handleStep2Next}
              onBack={handleStep2Back}
            />
          )}
          {currentStep === 3 && (
            <OnboardingStep3
              termsAccepted={termsAccepted}
              riskAcknowledged={riskAcknowledged}
              onTermsChange={setTermsAccepted}
              onRiskChange={setRiskAcknowledged}
              onSubmit={handleComplete}
              onBack={handleStep3Back}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

