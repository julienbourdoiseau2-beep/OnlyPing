-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SERVICE',
    "level" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "commissionBpsOverride" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coachId" TEXT NOT NULL,
    CONSTRAINT "Video_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("coachId", "commissionBpsOverride", "createdAt", "description", "durationMin", "id", "isPublished", "level", "priceCents", "slug", "thumbnail", "title", "videoUrl") SELECT "coachId", "commissionBpsOverride", "createdAt", "description", "durationMin", "id", "isPublished", "level", "priceCents", "slug", "thumbnail", "title", "videoUrl" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
