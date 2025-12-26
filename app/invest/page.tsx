import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { PropertyService } from "@/server/services/property.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { AppLayout } from "@/components/layout/app-layout";
import { InvestmentFlow } from "@/components/investment/investment-flow";

export default async function InvestPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/invest");
  }

  // Check onboarding status
  const isOnboardingComplete = await OnboardingService.isOnboardingComplete(
    session.user.id
  );

  if (!isOnboardingComplete) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const propertySlug = params.property;

  if (!propertySlug) {
    redirect("/dashboard/properties");
  }

  // Get property details
  const property = await PropertyService.getPropertyBySlug(
    propertySlug,
    session.user.id
  );

  if (!property) {
    redirect("/dashboard/properties?error=property_not_found");
  }

  // Check if property is open for investment
  if (property.status !== "OPEN") {
    redirect(`/properties/${propertySlug}?error=property_not_open`);
  }

  // Serialize Decimal fields to numbers for client components
  const serializedProperty = {
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: property.targetRaise ? Number(property.targetRaise) : null,
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <InvestmentFlow property={serializedProperty} userId={session.user.id} />
      </div>
    </AppLayout>
  );
}

