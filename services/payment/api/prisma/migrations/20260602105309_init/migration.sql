-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "referral_id" TEXT;

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pending_referrals_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_referees" (
    "id" TEXT NOT NULL,
    "referee_user_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discount_used" BOOLEAN NOT NULL DEFAULT false,
    "discount_used_at" TIMESTAMP(3),
    "discount_order_id" TEXT,
    "referral_id" TEXT NOT NULL,

    CONSTRAINT "referral_referees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_percent" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_amount" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referral_id" TEXT NOT NULL,

    CONSTRAINT "referral_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referrals_code_key" ON "referrals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_user_id_key" ON "referrals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_referees_referee_user_id_key" ON "referral_referees"("referee_user_id");

-- AddForeignKey
ALTER TABLE "referral_referees" ADD CONSTRAINT "referral_referees_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_payments" ADD CONSTRAINT "referral_payments_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
