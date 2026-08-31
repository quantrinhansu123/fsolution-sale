-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'cái';
