import { prisma } from "@/server/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminInvestmentsTable } from "@/components/admin/investments/admin-investments-table";
import { formatCurrencyNGN } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    userId?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const params = await searchParams;

  // Build filters
  const where: any = {};

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.propertyId) {
    where.propertyId = params.propertyId;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.createdAt.lte = new Date(params.endDate);
    }
  }

  // Get investments with user and property info
  const investments = await prisma.investment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          onboarding: {
            select: {
              kycStatus: true,
            },
          },
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Get statistics
  const [totalInvestments, pendingCount, confirmedCount, cancelledCount, totalInvested] =
    await Promise.all([
      prisma.investment.count(),
      prisma.investment.count({ where: { status: "PENDING" } }),
      prisma.investment.count({ where: { status: "CONFIRMED" } }),
      prisma.investment.count({ where: { status: "CANCELLED" } }),
      prisma.investment.aggregate({
        where: { status: "CONFIRMED" },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

  // Serialize Decimal fields - explicitly convert Decimal objects to numbers
  // Use a robust conversion that handles Prisma Decimal objects
  const serializedInvestments = investments.map((inv) => {
    // Convert Decimal fields - Prisma Decimal objects can be converted using Number() or toString()
    // Ensure we're creating plain number values, not Decimal objects
    let totalAmount: number;
    let pricePerShareAtPurchase: number;
    
    // Convert totalAmount
    if (inv.totalAmount === null || inv.totalAmount === undefined) {
      totalAmount = 0;
    } else if (typeof inv.totalAmount === 'number') {
      totalAmount = inv.totalAmount;
    } else if (typeof inv.totalAmount === 'string') {
      totalAmount = parseFloat(inv.totalAmount) || 0;
    } else {
      // Handle Decimal object - try multiple conversion methods
      const decimalValue = inv.totalAmount as any;
      if (typeof decimalValue.toNumber === 'function') {
        totalAmount = decimalValue.toNumber();
      } else if (typeof decimalValue.toString === 'function') {
        totalAmount = parseFloat(decimalValue.toString()) || 0;
      } else {
        totalAmount = Number(decimalValue) || 0;
      }
    }
    
    // Convert pricePerShareAtPurchase
    if (inv.pricePerShareAtPurchase === null || inv.pricePerShareAtPurchase === undefined) {
      pricePerShareAtPurchase = 0;
    } else if (typeof inv.pricePerShareAtPurchase === 'number') {
      pricePerShareAtPurchase = inv.pricePerShareAtPurchase;
    } else if (typeof inv.pricePerShareAtPurchase === 'string') {
      pricePerShareAtPurchase = parseFloat(inv.pricePerShareAtPurchase) || 0;
    } else {
      // Handle Decimal object - try multiple conversion methods
      const decimalValue = inv.pricePerShareAtPurchase as any;
      if (typeof decimalValue.toNumber === 'function') {
        pricePerShareAtPurchase = decimalValue.toNumber();
      } else if (typeof decimalValue.toString === 'function') {
        pricePerShareAtPurchase = parseFloat(decimalValue.toString()) || 0;
      } else {
        pricePerShareAtPurchase = Number(decimalValue) || 0;
      }
    }
    
    // Final validation: ensure all numeric values are actually numbers (not Decimal objects)
    // Use Number() constructor to ensure we have plain numbers
    const finalTotalAmount = Number(totalAmount) || 0;
    const finalPricePerShare = Number(pricePerShareAtPurchase) || 0;
    
    // Create a completely new plain object with no Decimal references
    // All values are explicitly converted to plain JavaScript types
    return {
      id: String(inv.id),
      userId: String(inv.userId),
      propertyId: String(inv.propertyId),
      shares: Number(inv.shares),
      totalAmount: finalTotalAmount,
      pricePerShareAtPurchase: finalPricePerShare,
      status: inv.status as "PENDING" | "CONFIRMED" | "CANCELLED",
      createdAt: inv.createdAt instanceof Date ? inv.createdAt : new Date(inv.createdAt),
      updatedAt: inv.updatedAt instanceof Date ? inv.updatedAt : new Date(inv.updatedAt),
      user: {
        id: String(inv.user.id),
        name: inv.user.name || null,
        email: inv.user.email || null,
        onboarding: inv.user.onboarding ? { 
          kycStatus: inv.user.onboarding.kycStatus || null 
        } : null,
      },
      property: {
        id: String(inv.property.id),
        name: String(inv.property.name),
        slug: String(inv.property.slug),
      },
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Investments</h1>
          <p className="text-muted-foreground">
            View and manage all investments across the platform
          </p>
        </div>
        <Link href="/admin/investments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Investment
          </Button>
        </Link>
      </div>

      {serializedInvestments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No investments found.</p>
            <p className="text-sm text-muted-foreground">
              Create an investment to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AdminInvestmentsTable investments={serializedInvestments} currentFilters={params} />
      )}
    </div>
  );
}

