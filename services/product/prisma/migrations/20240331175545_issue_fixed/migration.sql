/*
  Warnings:

  - You are about to drop the column `prict` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "prict",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
