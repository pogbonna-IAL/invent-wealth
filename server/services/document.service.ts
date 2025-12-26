import { prisma } from "@/server/db/prisma";
import { DocumentScope, DocumentType } from "@prisma/client";

export class DocumentService {
  /**
   * Get user's documents
   */
  static async getUserDocuments(userId: string) {
    // Get personal documents
    const personalDocs = await prisma.document.findMany({
      where: {
        scope: "USER",
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get property documents for properties user has invested in
    const userInvestments = await prisma.investment.findMany({
      where: {
        userId,
        status: "CONFIRMED",
      },
      select: {
        propertyId: true,
      },
      distinct: ["propertyId"],
    });

    const propertyIds = userInvestments.map((inv) => inv.propertyId);

    const propertyDocs = await prisma.document.findMany({
      where: {
        scope: "PROPERTY",
        propertyId: {
          in: propertyIds,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      personal: personalDocs,
      property: propertyDocs,
    };
  }

  /**
   * Get documents for a specific property
   */
  static async getPropertyDocuments(propertyId: string) {
    return prisma.document.findMany({
      where: {
        propertyId,
        scope: "PROPERTY",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

