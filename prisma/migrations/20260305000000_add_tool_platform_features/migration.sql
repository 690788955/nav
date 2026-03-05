-- AlterTable: Add new columns to Site
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "tags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "platforms" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "screenshots" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "useCases" TEXT;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "likesCount" INTEGER NOT NULL DEFAULT 0;

-- Fix Site.updatedAt: change from static default to auto-update
-- Note: In PostgreSQL, @updatedAt is handled by Prisma Client at query time (not a DB trigger)
-- The column type remains TIMESTAMP(3) NOT NULL, no DB change needed for this.

-- CreateTable: Feedback
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contact" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Tag
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Feedback
CREATE INDEX IF NOT EXISTS "Feedback_toolId_idx" ON "Feedback"("toolId");
CREATE INDEX IF NOT EXISTS "Feedback_isDeleted_idx" ON "Feedback"("isDeleted");
CREATE INDEX IF NOT EXISTS "Feedback_toolId_isDeleted_idx" ON "Feedback"("toolId", "isDeleted");

-- CreateIndex: Tag
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX IF NOT EXISTS "Tag_isOfficial_idx" ON "Tag"("isOfficial");
CREATE INDEX IF NOT EXISTS "Tag_isApproved_idx" ON "Tag"("isApproved");

-- AddForeignKey: Feedback -> Site
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Feedback_toolId_fkey'
    ) THEN
        ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
