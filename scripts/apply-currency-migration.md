# Apply Transaction Currency Migration

Since Prisma migrate is having path issues, you can apply this migration manually:

## Option 1: Using psql (PostgreSQL command line)

```bash
psql $DATABASE_URL -f scripts/update-transaction-currency.sql
```

## Option 2: Using a database GUI tool (pgAdmin, DBeaver, etc.)

1. Connect to your database
2. Run the SQL from `scripts/update-transaction-currency.sql`:
   ```sql
   ALTER TABLE "Transaction" ALTER COLUMN "currency" SET DEFAULT 'NGN';
   UPDATE "Transaction" SET "currency" = 'NGN' WHERE "currency" = 'USD';
   ```

## Option 3: Mark migration as applied (if you've already run the SQL)

```bash
npx prisma migrate resolve --applied 20251224055141_update_transaction_currency_default_to_ngn
```

## Option 4: Use Prisma Studio

1. Run `npx prisma studio`
2. Navigate to Transaction table
3. Update records manually (not recommended for many records)

## Verify the changes

After applying, verify with:
```sql
SELECT currency, COUNT(*) FROM "Transaction" GROUP BY currency;
```

All transactions should show 'NGN' as currency.

