import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Edit } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    // Removed role filter to show all users (INVESTOR and ADMIN)
    include: {
      investments: {
        where: {
          status: "CONFIRMED",
        },
        include: {
          property: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          investments: true,
          payouts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Users</h1>
          <p className="text-muted-foreground">
            View all users and their investment activity
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users/new">
            <Button>Create User</Button>
          </Link>
          <Link href="/admin/investments/new">
            <Button variant="outline">Create Investment</Button>
          </Link>
        </div>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Investments</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Payouts</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Total Invested</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Joined</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const totalInvested = user.investments.reduce(
                  (sum, inv) => sum + Number(inv.totalAmount),
                  0
                );

                return (
                  <tr key={user.id} className="border-b">
                    <td className="p-4">
                      <p className="font-semibold">{user.name || "N/A"}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.email || "N/A"}</p>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={user.role === "ADMIN" ? "default" : "outline"}
                        className={user.role === "ADMIN" ? "bg-red-500 hover:bg-red-600" : ""}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{user._count.investments}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{user._count.payouts}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold">
                        ₦{totalInvested.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {format(user.createdAt, "MMM d, yyyy")}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm" title="View Details">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit User">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Investment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Investments</CardTitle>
          <CardDescription>Latest investment activity across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users
              .filter((user) => user.investments.length > 0)
              .slice(0, 10)
              .map((user) =>
                user.investments.slice(0, 3).map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-semibold">{user.name || user.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      {investment.property.name} • {investment.shares.toLocaleString()} shares
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₦{Number(investment.totalAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(investment.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

