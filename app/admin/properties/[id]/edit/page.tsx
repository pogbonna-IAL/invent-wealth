import { PropertyService } from "@/server/services/property.service";
import { notFound } from "next/navigation";
import { EditPropertyForm } from "@/components/admin/properties/edit-property-form";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await PropertyService.getPropertyById(id);

  if (!property) {
    notFound();
  }

  // Convert Decimal fields to numbers for client component serialization
  const serializedProperty = {
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: property.targetRaise ? Number(property.targetRaise) : null,
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit Property</h1>
        <p className="text-muted-foreground">
          Update property details
        </p>
      </div>

      <EditPropertyForm property={serializedProperty} />
    </div>
  );
}

