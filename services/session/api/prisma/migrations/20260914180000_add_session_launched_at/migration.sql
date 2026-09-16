-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "launched_at" TIMESTAMP(3);

-- Backfill launch timestamp for tables that already reached launched/closed.
-- Launch sets expires_at = launched_at + 8 hours (SessionService.EXPIRATION_HOURS).
UPDATE "sessions"
SET "launched_at" = "expires_at" - INTERVAL '8 hours'
WHERE "status" IN ('launched', 'closed')
  AND "expires_at" IS NOT NULL
  AND "launched_at" IS NULL;
