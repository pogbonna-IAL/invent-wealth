import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { PropertyService } from "@/server/services/property.service";
import { PropertiesCatalog } from "@/components/properties/properties-catalog";

export const dynamic = "force-dynamic";

export default async function DashboardPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    type?: string;
    minInvestment?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const properties = await PropertyService.getPropertiesWithFilters({
    city: params.city,
    propertyType: params.type,
    minInvestment: params.minInvestment ? Number(params.minInvestment) : undefined,
    status: params.status as any,
    sortBy: params.sort as any,
  });

  // Calculate availableShares dynamically for each property
  const { prisma } = await import("@/server/db/prisma");
  const propertiesWithAvailableShares = await Promise.all(
    properties.map(async (property) => {
      // Get total confirmed investments for this property
      const totalInvestedShares = await prisma.investment.aggregate({
        where: {
          propertyId: property.id,
          status: "CONFIRMED",
        },
        _sum: {
          shares: true,
        },
      });
      const investedShares = totalInvestedShares._sum.shares || 0;
      const availableShares = property.totalShares - investedShares;

      return {
        ...property,
        availableShares, // Use dynamically calculated value
      };
    })
  );

  // Serialize Decimal fields to numbers for client components
  const serializedProperties = propertiesWithAvailableShares.map((property) => ({
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: property.targetRaise ? Number(property.targetRaise) : null,
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
  }));

  // Get unique values for filters
  const allProperties = await PropertyService.getProperties();
  const cities = [...new Set(allProperties.map((p) => p.city))].sort();
  const types = [...new Set(allProperties.map((p) => p.propertyType))].sort();

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Properties</h1>
        <p className="text-muted-foreground">
          Discover investment opportunities in premium properties
        </p>
      </div>

      <PropertiesCatalog
        properties={serializedProperties}
        cities={cities}
        types={types}
        currentFilters={{
          city: params.city,
          type: params.type,
          minInvestment: params.minInvestment,
          status: params.status,
          sort: params.sort,
        }}
      />
    </div>
  );
}

