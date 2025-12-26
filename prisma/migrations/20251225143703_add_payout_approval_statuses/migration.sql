-- AlterEnum
-- Add new values to PayoutStatus enum
-- Note: PostgreSQL requires these to be added one at a time and cannot be done in a transaction
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

