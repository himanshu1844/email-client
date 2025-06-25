/*
  Warnings:

  - You are about to drop the column `userId` on the `account` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "userId";
