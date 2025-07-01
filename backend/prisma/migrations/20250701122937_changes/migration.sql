/*
  Warnings:

  - You are about to drop the column `fromId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the `EmailAddress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BccEmails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CcEmails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ReplyToEmails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ToEmails` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `from` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_fromId_fkey";

-- DropForeignKey
ALTER TABLE "EmailAddress" DROP CONSTRAINT "EmailAddress_id_fkey";

-- DropForeignKey
ALTER TABLE "Thread" DROP CONSTRAINT "Thread_id_fkey";

-- DropForeignKey
ALTER TABLE "_BccEmails" DROP CONSTRAINT "_BccEmails_A_fkey";

-- DropForeignKey
ALTER TABLE "_BccEmails" DROP CONSTRAINT "_BccEmails_B_fkey";

-- DropForeignKey
ALTER TABLE "_CcEmails" DROP CONSTRAINT "_CcEmails_A_fkey";

-- DropForeignKey
ALTER TABLE "_CcEmails" DROP CONSTRAINT "_CcEmails_B_fkey";

-- DropForeignKey
ALTER TABLE "_ReplyToEmails" DROP CONSTRAINT "_ReplyToEmails_A_fkey";

-- DropForeignKey
ALTER TABLE "_ReplyToEmails" DROP CONSTRAINT "_ReplyToEmails_B_fkey";

-- DropForeignKey
ALTER TABLE "_ToEmails" DROP CONSTRAINT "_ToEmails_A_fkey";

-- DropForeignKey
ALTER TABLE "_ToEmails" DROP CONSTRAINT "_ToEmails_B_fkey";

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "fromId",
ADD COLUMN     "bcc" TEXT[],
ADD COLUMN     "cc" TEXT[],
ADD COLUMN     "from" TEXT NOT NULL,
ADD COLUMN     "replyTo" TEXT[],
ADD COLUMN     "to" TEXT[];

-- DropTable
DROP TABLE "EmailAddress";

-- DropTable
DROP TABLE "_BccEmails";

-- DropTable
DROP TABLE "_CcEmails";

-- DropTable
DROP TABLE "_ReplyToEmails";

-- DropTable
DROP TABLE "_ToEmails";

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
