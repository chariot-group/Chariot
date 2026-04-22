-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "code" TEXT;

-- Backfill existing rows with a unique placeholder value
UPDATE "sessions" SET "code" = gen_random_uuid()::text WHERE "code" IS NULL;

-- Set NOT NULL constraint
ALTER TABLE "sessions" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_code_key" ON "sessions"("code");
