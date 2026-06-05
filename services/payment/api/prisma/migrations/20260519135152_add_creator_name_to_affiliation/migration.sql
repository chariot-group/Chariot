/*
  Warnings:

  - Added the required column `creator_name` to the `affiliations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "affiliations" ADD COLUMN     "creator_name" TEXT;

-- Backfill existing rows before enforcing NOT NULL.
UPDATE "affiliations"
SET "creator_name" = "name"
WHERE "creator_name" IS NULL;

ALTER TABLE "affiliations" ALTER COLUMN "creator_name" SET NOT NULL;
