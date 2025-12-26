import { CreateBackdatedInvestmentForm } from "@/components/admin/investments/create-backdated-investment-form";
import { PropertyService } from "@/server/services/property.service";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function NewBackdatedInvestmentPage() {
  const properties = await PropertyService.getProperties();
  const users = await prisma.user.findMany({
    where: { role: "INVESTOR" },
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Serialize Decimal fields
  const serializedProperties = properties.map((property) => ({
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: property.targetRaise ? Number(property.targetRaise) : null,
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create Backdated Investment</h1>
        <p className="text-muted-foreground">
          Create an investment with a custom date to import historical data
        </p>
      </div>

      <CreateBackdatedInvestmentForm properties={serializedProperties} users={users} />
    </div>
  );
}

