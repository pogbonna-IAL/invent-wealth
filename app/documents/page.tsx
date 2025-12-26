import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { DocumentService } from "@/server/services/document.service";
import { OnboardingService } from "@/server/services/onboarding.service";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsList } from "@/components/documents/documents-list";
import { FileText, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const isOnboardingComplete = await OnboardingService.isOnboardingComplete(
    session.user.id
  );

  if (!isOnboardingComplete) {
    redirect("/onboarding");
  }

  const { personal, property } = await DocumentService.getUserDocuments(
    session.user.id
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">
            Access your personal documents and property-related documents
          </p>
        </div>

        <Tabs defaultValue="property" className="w-full">
          <TabsList>
            <TabsTrigger value="property">
              Property Documents ({property.length})
            </TabsTrigger>
            <TabsTrigger value="personal">
              Personal Documents ({personal.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="mt-6">
            <DocumentsList
              documents={property}
              type="property"
              emptyMessage="No property documents available. Documents will appear here once you invest in properties."
            />
          </TabsContent>

          <TabsContent value="personal" className="mt-6">
            <DocumentsList
              documents={personal}
              type="personal"
              emptyMessage="No personal documents available."
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

