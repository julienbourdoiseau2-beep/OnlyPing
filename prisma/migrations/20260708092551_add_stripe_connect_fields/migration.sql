-- CreateTable
CREATE TABLE "CoachStripeAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeConnectId" TEXT,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachStripeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachStripeAccount_userId_key" ON "CoachStripeAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachStripeAccount_stripeConnectId_key" ON "CoachStripeAccount"("stripeConnectId");

-- AddForeignKey
ALTER TABLE "CoachStripeAccount" ADD CONSTRAINT "CoachStripeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
