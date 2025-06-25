/*
  Warnings:

  - You are about to drop the column `token` on the `account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessToken]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refreshToken]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accessToken` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `account` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "account_token_key";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "token",
ADD COLUMN     "accessToken" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_accessToken_key" ON "account"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "account_refreshToken_key" ON "account"("refreshToken");
