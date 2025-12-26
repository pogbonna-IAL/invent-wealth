import { prisma } from "@/server/db/prisma";
import { UserRole } from "@prisma/client";

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === UserRole.ADMIN;
}

/**
 * Require admin role or throw error
 */
export async function requireAdmin(userId: string): Promise<void> {
  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error("Admin access required");
  }
}

