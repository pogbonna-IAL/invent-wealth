import { prisma } from "@/server/db/prisma";
import { notFound } from "next/navigation";
import { EditInvestmentForm } from "@/components/admin/users/edit-investment-form";

export const dynamic = "force-dynamic";

export default async function EditInvestmentPage({
  params,
}: {
  params: Promise<{ id: string; investmentId: string }>;
}) {
  const { id, investmentId } = await params;

  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!investment || investment.userId !== id) {
    notFound();
  }

  // Serialize Decimal fields to numbers for client component
  const serializedInvestment = {
    id: investment.id,
    userId: investment.userId,
    propertyId: investment.propertyId,
    propertyName: investment.property.name,
    shares: investment.shares,
    totalAmount: Number(investment.totalAmount),
    pricePerShareAtPurchase: Number(investment.pricePerShareAtPurchase),
    status: investment.status,
    createdAt: investment.createdAt.toISOString().slice(0, 16),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit Investment</h1>
        <p className="text-muted-foreground">
          Update investment details for {investment.user.name || investment.user.email}
        </p>
      </div>

      <EditInvestmentForm investment={serializedInvestment} />
    </div>
  );
}

