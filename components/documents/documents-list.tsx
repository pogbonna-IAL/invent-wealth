"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  url: string;
  docType: string;
  createdAt: Date;
  property?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface DocumentsListProps {
  documents: Document[];
  type: "property" | "personal";
  emptyMessage: string;
}

export function DocumentsList({
  documents,
  type,
  emptyMessage,
}: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{doc.title}</h3>
                  <Badge variant="outline">{doc.docType}</Badge>
                </div>
                {type === "property" && doc.property && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Property:{" "}
                    <Link
                      href={`/properties/${doc.property.slug}`}
                      className="text-primary hover:underline"
                    >
                      {doc.property.name}
                    </Link>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Uploaded: {format(new Date(doc.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

