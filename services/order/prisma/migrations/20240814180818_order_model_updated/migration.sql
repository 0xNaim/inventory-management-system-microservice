/*
  Warnings:

  - You are about to drop the column `grandtotal` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "grandtotal",
ADD COLUMN     "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
