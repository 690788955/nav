/*
  Warnings:

  - You are about to drop the column `comment` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Tag` table. All the data in the column will be lost.
  - Added the required column `content` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toolId` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contact" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Feedback_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Feedback" ("createdAt", "id", "likesCount", "updatedAt") SELECT "createdAt", "id", "likesCount", "updatedAt" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
CREATE INDEX "Feedback_toolId_idx" ON "Feedback"("toolId");
CREATE INDEX "Feedback_likesCount_idx" ON "Feedback"("likesCount");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "submitter_contact" TEXT,
    "submitter_ip" TEXT,
    "categoryId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "screenshots" TEXT NOT NULL DEFAULT '[]',
    "useCases" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Site" ("categoryId", "createdAt", "description", "iconUrl", "id", "isPublished", "likesCount", "name", "order", "platforms", "screenshots", "submitter_contact", "submitter_ip", "tags", "updatedAt", "url", "useCases") SELECT "categoryId", "createdAt", "description", "iconUrl", "id", "isPublished", "likesCount", "name", "order", "platforms", "screenshots", "submitter_contact", "submitter_ip", "tags", "updatedAt", "url", "useCases" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE INDEX "Site_categoryId_idx" ON "Site"("categoryId");
CREATE INDEX "Site_isPublished_idx" ON "Site"("isPublished");
CREATE INDEX "Site_categoryId_isPublished_idx" ON "Site"("categoryId", "isPublished");
CREATE INDEX "Site_order_idx" ON "Site"("order");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tag" ("createdAt", "id", "name", "slug", "updatedAt") SELECT "createdAt", "id", "name", "slug", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
