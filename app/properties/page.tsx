import { PropertyService } from "@/server/services/property.service";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PropertyCard } from "@/components/ui/property-card";
import { SocialShare } from "@/components/marketing/social-share";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties - InventWealth | Browse Investment Opportunities",
  description: "Browse premium properties available for fractional ownership investment. View property details, projected yields, and investment terms.",
  openGraph: {
    title: "Properties - InventWealth",
    description: "Browse premium properties for fractional ownership investment.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await PropertyService.getProperties();

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

  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight">Available Properties</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Invest in premium properties through fractional ownership. Start from as little as ₦600,000 ($400).
            </p>
          </div>
          <SocialShare 
            title="Check out these premium property investment opportunities on InventWealth"
            description="Invest in fractional property ownership and earn monthly rental income"
          />
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Badge variant="outline" className="px-4 py-1.5">
            <TrendingUp className="h-3 w-3 mr-1.5" />
            {properties.length} Properties Available
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5">
            Monthly Distributions
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5">
            Fully Managed
          </Badge>
        </div>
      </div>

      {serializedProperties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No properties available at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serializedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              slug={property.slug}
              name={property.name}
              addressShort={property.addressShort}
              city={property.city}
              country={property.country}
              coverImage={property.coverImage}
              pricePerShare={property.pricePerShare}
              totalShares={property.totalShares}
              availableShares={property.availableShares}
              minShares={property.minShares}
              status={property.status}
              projectedAnnualYieldPct={property.projectedAnnualYieldPct}
            />
          ))}
        </div>
      )}
    </div>
    </MarketingLayout>
  );
}

