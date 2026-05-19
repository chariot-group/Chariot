/*
  Warnings:

  - Added the required column `creator_name` to the `affiliations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "affiliations" ADD COLUMN     "creator_name" TEXT NOT NULL;
