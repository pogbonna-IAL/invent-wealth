"use server";

import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/services/admin.service";
import { prisma } from "@/server/db/prisma";
import { PropertyStatus, PropertyType, ShortletModel } from "@prisma/client";
import { z } from "zod";

const createPropertySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  addressShort: z.string().min(1, "Address is required"),
  description: z.string().min(1, "Description is required"),
  propertyType: z.nativeEnum(PropertyType),
  shortletModel: z.nativeEnum(ShortletModel),
  totalShares: z.number().int().positive(),
  pricePerShare: z.number().positive(),
  minShares: z.number().int().positive(),
  targetRaise: z.number().positive().optional(),
  projectedAnnualYieldPct: z.number().min(0).max(100),
  status: z.nativeEnum(PropertyStatus),
  coverImage: z.string().url().optional().or(z.literal("")),
  gallery: z.array(z.string().url()).max(20).optional(),
  highlights: z.array(z.string()).optional(),
  createdAt: z.string().optional(), // ISO date string for backdating
});

export async function createProperty(data: z.infer<typeof createPropertySchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const validated = createPropertySchema.parse(data);

    // Check if slug already exists
    const existing = await prisma.property.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return { success: false, error: "Property with this slug already exists" };
    }

    // Calculate targetRaise if not provided
    const targetRaise = validated.targetRaise ?? Number(validated.totalShares) * Number(validated.pricePerShare);

    // Parse createdAt for backdating
    const createdAt = validated.createdAt ? new Date(validated.createdAt) : new Date();

    const property = await prisma.property.create({
      data: {
        ...validated,
        availableShares: validated.totalShares,
        coverImage: validated.coverImage || null,
        highlights: validated.highlights || [],
        gallery: validated.gallery || [],
        targetRaise,
        createdAt,
        updatedAt: createdAt,
      },
    });

    return { success: true, propertyId: property.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Create property error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create property",
    };
  }
}

const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().min(1),
});

export async function updateProperty(data: z.infer<typeof updatePropertySchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await requireAdmin(session.user.id);

    const { id, ...updateData } = updatePropertySchema.parse(data);

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return { success: true, property };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Update property error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update property",
    };
  }
}

