/**
 * Script to apply the transaction currency migration
 * Run with: npx tsx scripts/apply-currency-migration.ts
 */

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Prisma 6.x reads DATABASE_URL from environment automatically
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("🔄 Applying transaction currency migration...");

    // Update default value
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Transaction" ALTER COLUMN "currency" SET DEFAULT 'NGN';
    `);
    console.log("✅ Updated default currency to NGN");

    // Update existing records
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "Transaction" SET "currency" = 'NGN' WHERE "currency" = 'USD';
    `);
    console.log(`✅ Updated existing transactions to NGN`);

    // Verify
    const currencyCounts = await prisma.$queryRawUnsafe<Array<{ currency: string; count: bigint }>>(`
      SELECT currency, COUNT(*) as count 
      FROM "Transaction" 
      GROUP BY currency;
    `);

    console.log("\n📊 Currency distribution after migration:");
    currencyCounts.forEach((row) => {
      console.log(`   ${row.currency}: ${row.count} transactions`);
    });

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error applying migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

applyMigration();

