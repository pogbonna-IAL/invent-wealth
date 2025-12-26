-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "currency" SET DEFAULT 'NGN';

-- Update existing records to NGN if they are USD
UPDATE "Transaction" SET "currency" = 'NGN' WHERE "currency" = 'USD';

