import { CreateStatementForm } from "@/components/admin/statements/create-statement-form";
import { PropertyService } from "@/server/services/property.service";

export const dynamic = "force-dynamic";

export default async function NewStatementPage() {
  const properties = await PropertyService.getProperties();

  // Serialize Decimal fields to numbers for client components
  const serializedProperties = properties.map((property) => ({
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: property.targetRaise ? Number(property.targetRaise) : null,
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create Rental Statement</h1>
        <p className="text-muted-foreground">
          Add a new monthly rental income statement
        </p>
      </div>

      <CreateStatementForm properties={serializedProperties} />
    </div>
  );
}

