import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({
    include: {
      property: {
        select: {
          name: true,
          slug: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
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
          <h1 className="text-3xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">
            Manage property and user documents
          </p>
        </div>
        <Link href="/admin/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No documents found.</p>
            <Link href="/admin/documents/new">
              <Button>Upload First Document</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Scope</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Property</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-b">
                  <td className="p-4">
                    <p className="font-semibold">{document.title}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{document.scope}</p>
                  </td>
                  <td className="p-4">
                    {document.property ? (
                      <Link
                        href={`/properties/${document.property.slug}`}
                        className="text-sm hover:underline"
                      >
                        {document.property.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{document.docType}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">
                      {format(document.createdAt, "MMM d, yyyy")}
                    </p>
                  </td>
                  <td className="p-4">
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </a>
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

