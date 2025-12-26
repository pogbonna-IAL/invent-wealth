import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";
import { calculateMonthlyBreakdown, prorateToMonthly, type MonthlyBreakdown } from "@/lib/utils/statement-pro-rating";

const operatingCostItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(["GENERAL_OPERATIONS", "MARKETING", "MAINTENANCE"]).optional(),
});

const createStatementSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
  grossRevenue: z.number().positive(),
  operatingCosts: z.number().min(0),
  operatingCostItems: z.array(operatingCostItemSchema).optional(),
  managementFee: z.number().min(0), // Dollar amount (calculated from percentage)
  managementFeePct: z.number().min(0).max(100).optional(), // Percentage (for reference)
  incomeAdjustment: z.number().optional().default(0), // Can be positive or negative
  occupancyRatePct: z.number().min(0).max(100),
  adr: z.number().positive(),
  notes: z.string().optional(),
});

const updateStatementSchema = createStatementSchema.partial().extend({
  statementId: z.string().min(1, "Statement ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const body = await request.json();
    const validated = createStatementSchema.parse(body);

    // Note: Backdating is allowed to enable importing historical data
    // No date restrictions are applied - admins can create statements for any date range
    
    const periodStart = new Date(validated.periodStart);
    const periodEnd = new Date(validated.periodEnd);
    
    // Check if period spans multiple months
    const startMonth = periodStart.getMonth();
    const endMonth = periodEnd.getMonth();
    const startYear = periodStart.getFullYear();
    const endYear = periodEnd.getFullYear();
    
    const spansMultipleMonths = 
      startYear !== endYear || 
      startMonth !== endMonth ||
      (startYear === endYear && startMonth === endMonth && 
       (periodStart.getDate() !== 1 || periodEnd.getDate() !== new Date(endYear, endMonth + 1, 0).getDate()));
    
    // Calculate monthly breakdown for pro-rating
    let monthlyBreakdown: MonthlyBreakdown[] | null = null;
    let proratedOperatingCostItems: Array<{ description: string; amount: number; category?: string; monthlyAmount: number }> | null = null;
    
    if (spansMultipleMonths && validated.operatingCostItems && validated.operatingCostItems.length > 0) {
      monthlyBreakdown = calculateMonthlyBreakdown(periodStart, periodEnd);
      
      // Pro-rate each cost item to monthly values
      proratedOperatingCostItems = validated.operatingCostItems.map((item) => {
        const { monthlyAmount } = prorateToMonthly(item.amount, periodStart, periodEnd);
        return {
          ...item,
          originalAmount: item.amount,
          monthlyAmount: Math.round(monthlyAmount * 100) / 100, // Round to 2 decimal places
          breakdown: monthlyBreakdown,
        };
      });
    }

    // Calculate net distributable (including income adjustment)
    const incomeAdjustment = validated.incomeAdjustment ?? 0;
    const netDistributable =
      validated.grossRevenue - validated.operatingCosts - validated.managementFee + incomeAdjustment;

    const statement = await prisma.rentalStatement.create({
      data: {
        propertyId: validated.propertyId,
        periodStart,
        periodEnd,
        grossRevenue: validated.grossRevenue,
        operatingCosts: validated.operatingCosts,
        operatingCostItems: proratedOperatingCostItems || validated.operatingCostItems || undefined,
        managementFee: validated.managementFee,
        incomeAdjustment: incomeAdjustment,
        netDistributable,
        occupancyRatePct: validated.occupancyRatePct,
        adr: validated.adr,
        notes: validated.notes || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      statement,
      prorated: spansMultipleMonths,
      monthlyBreakdown: spansMultipleMonths ? monthlyBreakdown : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create statement error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create statement",
      },
      { status: 500 }
    );
  }
}

