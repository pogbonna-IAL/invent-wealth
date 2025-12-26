import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrencyNGN } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export default async function AdminDistributionsPage() {
  const distributions = await prisma.distribution.findMany({
    include: {
      property: {
        select: {
          name: true,
          slug: true,
        },
      },
      rentalStatement: {
        select: {
          periodStart: true,
          periodEnd: true,
        },
      },
      payouts: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      declaredAt: "desc",
    },
    take: 50,
  });

  // Serialize Decimal fields to prevent passing Decimal objects to client components
  const serializedDistributions = distributions.map((dist) => ({
    ...dist,
    totalDistributed: Number(dist.totalDistributed),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Distributions</h1>
          <p className="text-muted-foreground">
            Declare and manage income distributions (create distributions that generate payouts)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/income">
            <Button variant="outline">
              View Income & Payouts
            </Button>
          </Link>
          <Link href="/admin/distributions/bulk">
            <Button variant="outline">
              Bulk Create Distributions
            </Button>
          </Link>
          <Link href="/admin/distributions/dashboard">
            <Button variant="outline">
              Multi-Property Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {distributions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No distributions found.</p>
            <p className="text-sm text-muted-foreground">
              Create a rental statement first, then declare a distribution.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">Property</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Period</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Total Distributed</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Payouts</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Declared At</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {serializedDistributions.map((distribution) => (
                <tr key={distribution.id} className="border-b">
                  <td className="p-4">
                    <Link
                      href={`/properties/${distribution.property.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {distribution.property.name}
                    </Link>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {format(distribution.rentalStatement.periodStart, "MMM yyyy")}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold">
                      {formatCurrencyNGN(Number(distribution.totalDistributed), "NGN")}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {distribution.payouts.length} payouts
                    </p>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={distribution.status === "PAID" ? "default" : "secondary"}
                    >
                      {distribution.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {distribution.declaredAt ? format(distribution.declaredAt, "MMM d, yyyy") : "-"}
                    </p>
                  </td>
                  <td className="p-4">
                    <Link href={`/admin/distributions/${distribution.id}`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

