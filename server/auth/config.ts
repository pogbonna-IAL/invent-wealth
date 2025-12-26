import type { NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db/prisma";

// Ensure Prisma client is initialized before using adapter
if (!prisma) {
  throw new Error("Prisma client not initialized");
}

// Lazy-load Prisma instance for callbacks (to avoid Edge runtime issues)
let prismaInstance: any;

async function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = prisma;
  }
  return prismaInstance;
}

const providers = [
  EmailProvider({
    server: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.SMTP_FROM || "noreply@inventwealth.com",
  }),
  CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
        const isDev = process.env.NODE_ENV === "development";
        
        if (isDev) {
          console.log("[Auth] ===== AUTHORIZE FUNCTION CALLED =====");
        }
        
        try {
          if (isDev) {
            console.log("[Auth] authorize called with:", {
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password,
              emailLength: credentials?.email?.length,
              passwordLength: credentials?.password?.length,
            });
          }

          if (!credentials?.email || !credentials?.password) {
            if (isDev) {
              console.log("[Auth] Missing credentials");
            }
            return null;
          }

          // Trim whitespace from credentials
          let email = credentials.email.trim();
          const password = credentials.password.trim();

          if (isDev) {
            console.log("[Auth] Attempting authentication for:", email.toLowerCase());
          }

          // Lazy-load Prisma for credentials provider (only runs in Node.js runtime)
          let prismaClient;
          try {
            prismaClient = await getPrisma();
            
            // Test database connection
            try {
              await prismaClient.$connect();
            } catch (connectError) {
              console.error("[Auth] Database connection test failed:", connectError);
              // Don't throw here, let the actual query fail if needed
            }
          } catch (prismaError) {
            console.error("[Auth] Failed to load Prisma client:", prismaError);
            // Return null to indicate auth failure
            return null;
          }

          // Handle dev mode admin login: "admin" / "admin123" maps to admin user
          if (isDev && email.toLowerCase() === "admin" && password === "admin123") {
            const adminUser = await prismaClient.user.findUnique({
              where: { email: "pogbonna@gmail.com" },
            });

            if (adminUser) {
              // Ensure admin user has password hash set
              if (!adminUser.passwordHash) {
                const bcrypt = require("bcryptjs");
                const passwordHash = await bcrypt.hash("admin123", 10);
                await prismaClient.user.update({
                  where: { id: adminUser.id },
                  data: { passwordHash },
                });
              }

              if (isDev) {
                console.log("[Auth] Dev admin login successful");
              }
              return {
                id: adminUser.id,
                email: adminUser.email || undefined,
                name: adminUser.name || undefined,
                role: adminUser.role,
              };
            } else {
              // Create admin user if it doesn't exist
              const bcrypt = require("bcryptjs");
              const passwordHash = await bcrypt.hash("admin123", 10);
              const newAdmin = await prismaClient.user.create({
                data: {
                  email: "pogbonna@gmail.com",
                  name: "Admin User",
                  role: "ADMIN",
                  passwordHash,
                  emailVerified: new Date(),
                },
              });

              if (isDev) {
                console.log("[Auth] Created admin user for dev login");
              }
              return {
                id: newAdmin.id,
                email: newAdmin.email || undefined,
                name: newAdmin.name || undefined,
                role: newAdmin.role,
              };
            }
          }

          // Find user by email
          const user = await prismaClient.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          // If user exists and has passwordHash, verify password
          if (user && user.passwordHash) {
            const bcrypt = require("bcryptjs");
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            
            if (isValidPassword) {
              if (isDev) {
                console.log("[Auth] Password authentication successful for:", email);
              }
              return {
                id: user.id,
                email: user.email || undefined,
                name: user.name || undefined,
                role: user.role,
              };
            } else {
              if (isDev) {
                console.log("[Auth] Invalid password for:", email);
              }
              return null;
            }
          }

          // User not found or doesn't have passwordHash
          if (isDev) {
            console.log("[Auth] User not found or no password set for:", email);
          }
          return null;
        } catch (error) {
          console.error("[Auth] Authorization error:", error instanceof Error ? error.message : "Unknown error");
          // Return null to indicate authentication failure
          // NextAuth will convert this to "CredentialsSignin" error
          return null;
        }
      },
    })
];

// Create auth options
// Note: Adapter is imported normally - it will cause issues in Edge runtime (proxy.ts)
// but that's OK because proxy.ts only uses auth() for JWT validation, not the adapter
// The adapter is only used in API routes (Node.js runtime) where Prisma works

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  providers,
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  // Enable verbose logging for credentials provider
  logger: {
    error(code, metadata) {
      console.error("[NextAuth] Error:", code, metadata);
    },
    warn(code) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[NextAuth] Warning:", code);
      }
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth] Debug:", code, metadata);
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Ensure user has Profile/Onboarding records on first login
      // Lazy-load Prisma (only runs in Node.js runtime, not Edge)
      if (user.id) {
        try {
          const prismaClient = await getPrisma();
          
          // Get user to check role
          const dbUser = await prismaClient.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          
          const isAdmin = dbUser?.role === "ADMIN";
          
          // Create Profile if it doesn't exist
          await prismaClient.profile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
              userId: user.id,
            },
          });

          // Create Onboarding if it doesn't exist
          // Auto-complete onboarding for admin users
          await prismaClient.onboarding.upsert({
            where: { userId: user.id },
            update: isAdmin ? {
              status: "COMPLETED",
              kycStatus: "APPROVED",
            } : {},
            create: {
              userId: user.id,
              status: isAdmin ? "COMPLETED" : "PENDING",
              kycStatus: isAdmin ? "APPROVED" : "PENDING",
            },
          });
        } catch (error) {
          // Log error but don't block sign in
          console.error("Error creating profile/onboarding:", error);
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        
        // Fetch user role from database
        try {
          const prismaClient = await getPrisma();
          const dbUser = await prismaClient.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = dbUser?.role;
        } catch (error) {
          console.error("[Auth] Error fetching user role:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        // Add role to session if available
        if (token.role) {
          (session.user as any).role = token.role;
        }
      }
      return session;
    },
  },
};
