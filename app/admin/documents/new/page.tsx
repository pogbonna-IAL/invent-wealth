import { PropertyService } from "@/server/services/property.service";
import { prisma } from "@/server/db/prisma";
import { UploadDocumentForm } from "@/components/admin/documents/upload-document-form";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const [properties, users] = await Promise.all([
    PropertyService.getProperties(),
    prisma.user.findMany({
      where: { role: "INVESTOR" },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Document</h1>
        <p className="text-muted-foreground">
          Add document metadata to the platform
        </p>
      </div>

      <UploadDocumentForm properties={properties} users={users} />
    </div>
  );
}

