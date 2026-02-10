/*
  Warnings:

  - You are about to drop the column `description` on the `SurveyTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SurveyTemplateQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `SurveyTemplateQuestion` table. All the data in the column will be lost.
  - Made the column `userId` on table `SurveyResponse` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Survey" ALTER COLUMN "anonymityThreshold" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SurveyResponse" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SurveyTemplate" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "SurveyTemplateQuestion" DROP COLUMN "createdAt",
DROP COLUMN "order";

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
