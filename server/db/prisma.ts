import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPromise: Promise<PrismaClient> | undefined;
};

/**
 * Prisma Client instance
 * Uses singleton pattern to prevent multiple instances in development
 * 
 * Prisma 6.x reads DATABASE_URL directly from environment variables.
 * Ensure DATABASE_URL is set in your .env file.
 * 
 * This uses lazy initialization to avoid requiring DATABASE_URL during build time.
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
  // Prisma 6.x reads DATABASE_URL from environment automatically via schema.prisma
  // We just need to ensure it's set (checked by getDatabaseUrl)
  getDatabaseUrl();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// Lazy getter - only initializes when accessed
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Check if we're in a build context
  // During build, Next.js might try to analyze code without DATABASE_URL
  const isBuildTime = 
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && process.argv.includes("build")) ||
    process.env.NEXT_BUILD === "true";

  // During build without DATABASE_URL, defer initialization
  // This allows the build to complete but will fail at runtime if DATABASE_URL is missing
  if (isBuildTime && !process.env.DATABASE_URL) {
    // Return a proxy that defers the error until actual use
    // PrismaAdapter might access properties during initialization, so we need to handle that
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        // Allow some properties that might be checked during build/adapter initialization
        if (
          prop === "then" || 
          prop === "constructor" || 
          typeof prop === "symbol" ||
          prop === "toString" ||
          prop === "valueOf"
        ) {
          return undefined;
        }
        
        // For PrismaAdapter, it might access model names or other metadata
        // Return a no-op function or empty object to allow adapter creation
        if (typeof prop === "string" && prop.startsWith("$")) {
          // Prisma internal methods like $connect, $disconnect, etc.
          return () => Promise.resolve();
        }
        
        // Return a proxy for model access (e.g., prisma.user, prisma.property)
        // This allows PrismaAdapter to inspect the schema without connecting
        return new Proxy({}, {
          get() {
            // Return another proxy for model methods
            return new Proxy(() => {}, {
              apply() {
                // If actually called at runtime, check DATABASE_URL
                if (!process.env.DATABASE_URL) {
                  const errorMessage = [
                    "DATABASE_URL environment variable is not set.",
                    "",
                    "To fix this:",
                    "1. Create a .env file in the project root",
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
                // If DATABASE_URL is now available, create the client
                const client = createPrismaClient();
                if (process.env.NODE_ENV !== "production") {
                  globalForPrisma.prisma = client;
                }
                // This won't work perfectly, but it's better than failing the build
                throw new Error("Prisma client accessed during build. Please set DATABASE_URL before building.");
              },
            });
          },
        });
      },
    });
  }

  const client = createPrismaClient();
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  
  return client;
}

// Export - initialization happens lazily on first access
export const prisma = getPrismaClient();

