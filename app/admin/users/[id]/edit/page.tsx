import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { EditUserForm } from "@/components/admin/users/edit-user-form";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      onboarding: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Extract risk answers
  const riskAnswers = user.onboarding?.riskAnswers as {
    riskTolerance?: string;
    investmentExperience?: string;
  } | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit User</h1>
        <p className="text-muted-foreground">
          Update user account and profile information
        </p>
      </div>

      <EditUserForm
        user={{
          id: user.id,
          email: user.email || "",
          name: user.name || "",
          phone: user.profile?.phone || "",
          address: user.profile?.address || "",
          country: user.profile?.country || "",
          dob: user.profile?.dob ? user.profile.dob.toISOString().split("T")[0] : "",
          createdAt: user.createdAt.toISOString().slice(0, 16),
          kycStatus: user.onboarding?.kycStatus || "PENDING",
          onboardingStatus: user.onboarding?.status || "PENDING",
          riskTolerance: riskAnswers?.riskTolerance || "moderate",
          investmentExperience: riskAnswers?.investmentExperience || "intermediate",
        }}
      />
    </div>
  );
}

