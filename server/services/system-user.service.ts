import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";

const UNDER_WRITER_EMAIL = process.env.UNDER_WRITER_EMAIL || "under_writer@system.inventwealth.com";
const UNDER_WRITER_NAME = "System Underwriter";

export class SystemUserService {
  /**
   * Get or create the system under_writer user
   * This user holds unsold shares and receives distributions for them
   * @param tx Optional transaction client. If provided, uses transaction context.
   */
  static async getOrCreateUnderWriter(tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    
    // Try to find existing under_writer user
    let underWriter = await client.user.findUnique({
      where: { email: UNDER_WRITER_EMAIL },
    });

    if (!underWriter) {
      // Create system user if it doesn't exist
      underWriter = await client.user.create({
        data: {
          email: UNDER_WRITER_EMAIL,
          name: UNDER_WRITER_NAME,
          role: "ADMIN", // System user with admin role
          emailVerified: new Date(),
        },
      });
    }

    return underWriter;
  }

  /**
   * Check if a user is the system under_writer
   */
  static isUnderWriter(userId: string, userEmail?: string | null): boolean {
    return userEmail === UNDER_WRITER_EMAIL;
  }

  /**
   * Get the under_writer email constant
   */
  static getUnderWriterEmail(): string {
    return UNDER_WRITER_EMAIL;
  }
}

