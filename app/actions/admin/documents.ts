"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { DocumentScope, DocumentType } from "@prisma/client";
import { z } from "zod";

const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Valid URL is required"),
  scope: z.nativeEnum(DocumentScope),
  docType: z.nativeEnum(DocumentType),
  propertyId: z.string().optional(),
  userId: z.string().optional(),
}).refine(
  (data) => {
    if (data.scope === "PROPERTY" && !data.propertyId) {
      return false;
    }
    if (data.scope === "USER" && !data.userId) {
      return false;
    }
    return true;
  },
  {
    message: "Property or User ID is required based on scope",
  }
);

export async function createDocument(data: z.infer<typeof createDocumentSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = createDocumentSchema.parse(data);

    const document = await prisma.document.create({
      data: {
        title: validated.title,
        url: validated.url,
        scope: validated.scope,
        docType: validated.docType,
        propertyId: validated.propertyId || null,
        userId: validated.userId || null,
      },
    });

    return { success: true, documentId: document.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Create document error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create document",
    };
  }
}

