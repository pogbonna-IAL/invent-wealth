import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const { id } = await params;
    const statement = await prisma.rentalStatement.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    // Parse operating cost items from JSON
    let operatingCostItems: Array<{ description: string; amount: number }> = [];
    if (statement.operatingCostItems) {
      try {
        const parsed = Array.isArray(statement.operatingCostItems)
          ? statement.operatingCostItems
          : JSON.parse(statement.operatingCostItems as string);
        
        if (Array.isArray(parsed)) {
          operatingCostItems = parsed.filter((item): item is { description: string; amount: number } => 
            typeof item === 'object' && 
            item !== null && 
            'description' in item && 
            'amount' in item &&
            typeof item.description === 'string' &&
            typeof item.amount === 'number'
          );
        }
      } catch (e) {
        // If parsing fails, create a single item from the total
        operatingCostItems = [
          {
            description: "Total Operating Costs",
            amount: Number(statement.operatingCosts),
          },
        ];
      }
    } else {
      // Fallback: create a single item from the total
      operatingCostItems = [
        {
          description: "Total Operating Costs",
          amount: Number(statement.operatingCosts),
        },
      ];
    }

    // Generate CSV content
    const csvRows: string[] = [];

    // Header
    csvRows.push("Operating Expenses Statement");
    csvRows.push("");
    csvRows.push(`Property: ${statement.property.name}`);
    csvRows.push(`Period: ${format(statement.periodStart, "MMM d, yyyy")} - ${format(statement.periodEnd, "MMM d, yyyy")}`);
    csvRows.push(`Generated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`);
    csvRows.push("");

    // Table header
    csvRows.push("Description,Amount (NGN)");

    // Cost items
    let total = 0;
    operatingCostItems.forEach((item) => {
      csvRows.push(`"${item.description}",${item.amount.toFixed(2)}`);
      total += item.amount;
    });

    // Total row
    csvRows.push("");
    csvRows.push(`"Total Operating Costs",${total.toFixed(2)}`);

    // Additional financial info
    csvRows.push("");
    csvRows.push("Financial Summary");
    csvRows.push(`Gross Revenue,${Number(statement.grossRevenue).toFixed(2)}`);
    csvRows.push(`Operating Costs,${total.toFixed(2)}`);
    csvRows.push(`Management Fee,${Number(statement.managementFee).toFixed(2)}`);
    csvRows.push(`Net Distributable,${Number(statement.netDistributable).toFixed(2)}`);

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="operating-expenses-${statement.property.name.replace(/\s+/g, "-")}-${format(statement.periodStart, "yyyy-MM")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Download expenses error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate expenses statement",
      },
      { status: 500 }
    );
  }
}

