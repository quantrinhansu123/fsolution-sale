-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "code" TEXT,
ADD COLUMN     "productInterest" TEXT,
ADD COLUMN     "threadId" TEXT;

-- AlterTable
ALTER TABLE "LeadLog" ADD COLUMN     "fieldChanged" TEXT,
ADD COLUMN     "newValue" TEXT,
ADD COLUMN     "oldValue" TEXT,
ALTER COLUMN "toStatus" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingPhone" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "discountPercent" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_code_key" ON "Lead"("code");

