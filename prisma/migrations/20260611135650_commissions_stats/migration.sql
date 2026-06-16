-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "coachNetAmount" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "commissionAmount" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "commissionBpsAtPurchase" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "commissionBps" INTEGER;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN "commissionBpsOverride" INTEGER;
