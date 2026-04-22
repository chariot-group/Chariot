-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('connected', 'disconnected', 'MasterGame');

-- AlterTable: make character_id nullable
ALTER TABLE "session_participants" ALTER COLUMN "character_id" DROP NOT NULL;

-- AlterTable: add status column
ALTER TABLE "session_participants" ADD COLUMN "status" "ParticipantStatus" NOT NULL DEFAULT 'connected';
