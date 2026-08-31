-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "market" TEXT,
    "product" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingReport" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "date" DATE NOT NULL,
    "shift" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "adCost" DOUBLE PRECISION NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "revenueActual" DOUBLE PRECISION NOT NULL,
    "warning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingReport_pkey" PRIMARY KEY ("id")
);
