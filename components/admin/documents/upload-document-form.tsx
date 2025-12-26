"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createDocument } from "@/app/actions/admin/documents";
import type { Property } from "@prisma/client";
import { DocumentScope, DocumentType } from "@prisma/client";

interface UserOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface UploadDocumentFormProps {
  properties: Property[];
  users: UserOption[];
}

export function UploadDocumentForm({ properties, users }: UploadDocumentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    scope: "GLOBAL" as DocumentScope,
    docType: "AGREEMENT" as DocumentType,
    propertyId: "",
    userId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createDocument({
        title: formData.title,
        url: formData.url,
        scope: formData.scope,
        docType: formData.docType,
        propertyId: formData.propertyId || undefined,
        userId: formData.userId || undefined,
      });

      if (result.success) {
        router.push("/admin/documents");
        router.refresh();
      } else {
        setError(("error" in result && result.error) ? result.error : "Failed to upload document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/documents">
          <Button type="button" variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">Upload Document</h2>
          <p className="text-sm text-muted-foreground">
            Add document metadata to the platform
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>Basic document details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Property Prospectus, Investment Agreement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Document URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/document.pdf"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the URL where the document is hosted
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scope">Scope *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    scope: value as DocumentScope,
                    propertyId: value !== "PROPERTY" ? "" : formData.propertyId,
                    userId: value !== "USER" ? "" : formData.userId,
                  });
                }}
                required
              >
                <SelectTrigger id="scope">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global (All Users)</SelectItem>
                  <SelectItem value="PROPERTY">Property Specific</SelectItem>
                  <SelectItem value="USER">User Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="docType">Document Type *</Label>
              <Select
                value={formData.docType}
                onValueChange={(value) =>
                  setFormData({ ...formData, docType: value as DocumentType })
                }
                required
              >
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGREEMENT">Agreement</SelectItem>
                  <SelectItem value="PROSPECTUS">Prospectus</SelectItem>
                  <SelectItem value="REPORT">Report</SelectItem>
                  <SelectItem value="STATEMENT">Statement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.scope === "PROPERTY" && (
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <Select
                value={formData.propertyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, propertyId: value })
                }
                required
              >
                <SelectTrigger id="propertyId">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.scope === "USER" && (
            <div className="space-y-2">
              <Label htmlFor="userId">User *</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
                required
              >
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href="/admin/documents">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload Document
        </Button>
      </div>
    </form>
  );
}

