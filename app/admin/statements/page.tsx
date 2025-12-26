import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { DeclareDistributionButton } from "@/components/admin/statements/declare-distribution-button";
import { DownloadExpensesButton } from "@/components/admin/statements/download-expenses-button";

export const dynamic = "force-dynamic";

export default async function AdminStatementsPage() {
  const statements = await prisma.rentalStatement.findMany({
    include: {
      property: {
        select: {
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
    orderBy: {
      periodStart: "desc",
    },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rental Statements</h1>
          <p className="text-muted-foreground">
            Manage monthly rental income statements
          </p>
        </div>
        <Link href="/admin/statements/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Statement
          </Button>
        </Link>
      </div>

      {statements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No rental statements found.</p>
            <Link href="/admin/statements/new">
              <Button>Create First Statement</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">Property</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Period</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Gross Revenue</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Operating Costs</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Management Fee</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Net Distributable</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Occupancy</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((statement) => {
                const hasDistribution = statement.distributions.length > 0;
                return (
                  <tr key={statement.id} className="border-b">
                    <td className="p-4">
                      <Link
                        href={`/properties/${statement.property.slug}`}
                        className="font-semibold hover:underline"
                      >
                        {statement.property.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {format(statement.periodStart, "MMM yyyy")}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">
                        ₦{Number(statement.grossRevenue).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        ₦{Number(statement.operatingCosts).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        ₦{Number(statement.managementFee).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-green-600">
                        ₦{Number(statement.netDistributable).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {Number(statement.occupancyRatePct).toFixed(1)}%
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/admin/statements/${statement.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <DownloadExpensesButton
                          statementId={statement.id}
                          propertyName={statement.property.name}
                          periodStart={statement.periodStart}
                          periodEnd={statement.periodEnd}
                        />
                        {hasDistribution ? (
                          <Link href="/admin/distributions">
                            <Button variant="outline" size="sm">
                              View Distribution
                            </Button>
                          </Link>
                        ) : (
                          <DeclareDistributionButton
                            propertyId={statement.propertyId}
                            rentalStatementId={statement.id}
                            propertyName={statement.property.name}
                            netDistributable={Number(statement.netDistributable)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

