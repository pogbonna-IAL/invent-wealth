import { prisma } from "@/server/db/prisma";
import { PropertyStatus, PropertyType, Prisma } from "@prisma/client";

interface PropertyFilters {
  city?: string;
  propertyType?: PropertyType | string;
  minInvestment?: number;
  status?: PropertyStatus | string;
  sortBy?: "newest" | "yield" | "funding";
}

export class PropertyService {
  /**
   * Get all properties with funding status
   */
  static async getProperties(status?: PropertyStatus) {
    return prisma.property.findMany({
      where: status ? { status } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get properties with filters and sorting
   */
  static async getPropertiesWithFilters(filters: PropertyFilters = {}) {
    const where: Prisma.PropertyWhereInput = {};

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.propertyType) {
      where.propertyType = filters.propertyType as PropertyType;
    }

    if (filters.status) {
      where.status = filters.status as PropertyStatus;
    }

    if (filters.minInvestment !== undefined) {
      // Calculate minimum shares needed for this investment amount
      // We need to find properties where minShares * pricePerShare <= minInvestment
      // This is a bit complex, so we'll filter in memory for now
    }

    // Get all properties matching basic filters
    let properties = await prisma.property.findMany({
      where,
      include: {
        _count: {
          select: {
            investments: {
              where: {
                status: "CONFIRMED",
              },
            },
          },
        },
      },
    });

    // Calculate funding percentage for each property
    const propertiesWithFunding = await Promise.all(
      properties.map(async (property) => {
        const totalInvestedShares = await prisma.investment.aggregate({
          where: {
            propertyId: property.id,
            status: "CONFIRMED",
          },
          _sum: {
            shares: true,
          },
        });

        const investedShares = totalInvestedShares._sum.shares || 0;
        const fundingPercentage = (investedShares / property.totalShares) * 100;

        return {
          ...property,
          investedShares,
          fundingPercentage,
        };
      })
    );

    // Filter by min investment if specified
    let filteredProperties = propertiesWithFunding;
    if (filters.minInvestment !== undefined) {
      filteredProperties = propertiesWithFunding.filter((property) => {
        const minInvestmentAmount =
          property.minShares * Number(property.pricePerShare);
        return minInvestmentAmount <= filters.minInvestment!;
      });
    }

    // Sort properties
    switch (filters.sortBy) {
      case "yield":
        filteredProperties.sort(
          (a, b) =>
            Number(b.projectedAnnualYieldPct) - Number(a.projectedAnnualYieldPct)
        );
        break;
      case "funding":
        filteredProperties.sort(
          (a, b) => b.fundingPercentage - a.fundingPercentage
        );
        break;
      case "newest":
      default:
        filteredProperties.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        break;
    }

    return filteredProperties;
  }

  /**
   * Get property by ID
   */
  static async getPropertyById(id: string) {
    return prisma.property.findUnique({
      where: { id },
    });
  }

  /**
   * Get property by slug
   */
  static async getPropertyBySlug(slug: string, userId?: string) {
    return this.getPropertyDetails(slug, userId, "slug");
  }

  /**
   * Get property details with investment stats
   */
  static async getPropertyDetails(
    identifier: string,
    userId?: string,
    by: "id" | "slug" = "id"
  ) {
    const property = await prisma.property.findUnique({
      where: by === "slug" ? { slug: identifier } : { id: identifier },
      include: {
        rentalStatements: {
          orderBy: {
            periodStart: "desc",
          },
          take: 12, // Last 12 months
          include: {
            distributions: {
              select: {
                id: true,
                status: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1, // Just get the latest one
            },
          },
        },
        documents: {
          where: {
            scope: "PROPERTY",
          },
        },
      },
    });

    if (!property) {
      return null;
    }

    // Get user's total shares from investments
    let userTotalShares = 0;
    if (userId) {
      const userInvestments = await prisma.investment.aggregate({
        where: {
          propertyId: property.id,
          userId,
          status: "CONFIRMED",
        },
        _sum: {
          shares: true,
        },
      });
      userTotalShares = userInvestments._sum.shares || 0;
    }

    // Calculate total invested shares
    const totalInvestedShares = await prisma.investment.aggregate({
      where: {
        propertyId: property.id,
        status: "CONFIRMED",
      },
      _sum: {
        shares: true,
      },
    });

    const investedShares = totalInvestedShares._sum.shares || 0;
    // Calculate availableShares dynamically from confirmed investments (more accurate than stored value)
    const availableShares = property.totalShares - investedShares;
    const fundingPercentage =
      (investedShares / property.totalShares) * 100;

    // Calculate total distributions paid
    const totalDistributions = await prisma.payout.aggregate({
      where: {
        propertyId: property.id,
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    });

    return {
      ...property,
      userTotalShares: userTotalShares > 0 ? userTotalShares : null,
      investedShares,
      availableShares, // Use dynamically calculated value
      fundingPercentage,
      totalDistributions: totalDistributions._sum.amount || 0,
    };
  }
}
