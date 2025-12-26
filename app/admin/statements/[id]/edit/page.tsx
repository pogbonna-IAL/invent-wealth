import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { EditStatementForm } from "@/components/admin/statements/edit-statement-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const statement = await prisma.rentalStatement.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      distributions: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!statement) {
    notFound();
  }

  // Parse operating cost items
  let operatingCostItems: Array<{
    id: string;
    category: string;
    description: string;
    amount: string;
  }> = [];
  if (statement.operatingCostItems) {
    try {
      const items = Array.isArray(statement.operatingCostItems)
        ? statement.operatingCostItems
        : JSON.parse(statement.operatingCostItems as string);
      operatingCostItems = items.map((item: any, index: number) => ({
        id: `existing-${index}`,
        category: item.category || "",
        description: item.description || "",
        amount: (item.amount || 0).toString(),
      }));
    } catch (e) {
      // If parsing fails, create a single item from the total
      operatingCostItems = [
        {
          id: "existing-0",
          category: "",
          description: "Total Operating Costs",
          amount: Number(statement.operatingCosts).toString(),
        },
      ];
    }
  }

  // Get all properties for the dropdown
  const properties = await prisma.property.findMany({
    orderBy: { name: "asc" },
  });

  const hasNonDraftDistribution = statement.distributions.some(
    (d) => d.status !== "DRAFT"
  );

  // Parse operatingCostItems for serializedStatement
  const parseOperatingCostItems = (items: any): Array<{ description: string; amount: number; category?: string; originalAmount?: number; monthlyAmount?: number }> | null => {
    if (!items) return null;
    
    try {
      const parsed = Array.isArray(items) ? items : JSON.parse(items as string);
      if (!Array.isArray(parsed)) return null;
      
      return parsed.filter((item): item is { description: string; amount: number; category?: string; originalAmount?: number; monthlyAmount?: number } => 
        typeof item === 'object' && 
        item !== null && 
        'description' in item && 
        'amount' in item &&
        typeof item.description === 'string' &&
        typeof item.amount === 'number'
      );
    } catch {
      return null;
    }
  };

  // Serialize Decimal fields to numbers for client component
  const serializedStatement = {
    ...statement,
    grossRevenue: Number(statement.grossRevenue),
    operatingCosts: Number(statement.operatingCosts),
    managementFee: Number(statement.managementFee),
    incomeAdjustment: Number(statement.incomeAdjustment ?? 0),
    netDistributable: Number(statement.netDistributable),
    occupancyRatePct: Number(statement.occupancyRatePct),
    adr: Number(statement.adr),
    periodStart: statement.periodStart,
    periodEnd: statement.periodEnd,
    operatingCostItems: parseOperatingCostItems(statement.operatingCostItems),
  };

  // Serialize properties Decimal fields to numbers
  const serializedProperties = properties.map((property) => ({
    ...property,
    pricePerShare: Number(property.pricePerShare),
    targetRaise: Number(property.targetRaise),
    projectedAnnualYieldPct: Number(property.projectedAnnualYieldPct),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/admin/statements/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Statement</h1>
          <p className="text-muted-foreground">
            {statement.property.name} - Update statement details
          </p>
        </div>
      </div>

      {hasNonDraftDistribution && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Warning: Distribution Exists
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              This statement has an associated distribution that is beyond DRAFT status.
              Editing may affect existing payouts. Please proceed with caution.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <EditStatementForm
        statement={serializedStatement}
        properties={serializedProperties}
        initialOperatingCostItems={operatingCostItems}
      />
    </div>
  );
}

