-- DropIndex
DROP INDEX "User_verificationToken_key";

-- AlterTable
ALTER TABLE "User" RENAME COLUMN "verificationToken" TO "verificationCode";
ALTER TABLE "User" RENAME COLUMN "verificationTokenExpiry" TO "verificationCodeExpiry";
