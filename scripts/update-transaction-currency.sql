-- Update Transaction currency default and existing records
-- Run this SQL directly in your database

-- AlterTable: Change default currency to NGN
ALTER TABLE "Transaction" ALTER COLUMN "currency" SET DEFAULT 'NGN';

-- Update existing records to NGN if they are USD
UPDATE "Transaction" SET "currency" = 'NGN' WHERE "currency" = 'USD';

