-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN "disputedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stripePaymentIntentId_key" ON "Purchase"("stripePaymentIntentId");
