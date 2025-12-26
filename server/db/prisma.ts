import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client instance
 * Uses singleton pattern to prevent multiple instances in development
 * 
 * Prisma 7.x requires an adapter for PostgreSQL connections.
 * Ensure DATABASE_URL is set in your .env file.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const errorMessage = [
      "DATABASE_URL environment variable is not set.",
      "",
      "To fix this:",
      "1. Create a .env file in the project root (copy from .env.example if available)",
      "2. Set DATABASE_URL with your PostgreSQL connection string",
      "   Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname",
      "",
      "For local development with Docker:",
      "   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventwealth",
      "",
      "See README.md for more setup instructions.",
    ].join("\n");
    throw new Error(errorMessage);
  }
  return url;
}

// Lazy initialization - only create connection when actually needed
function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();
  
  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

