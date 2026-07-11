-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Collaboration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kolId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "feature" TEXT NOT NULL,
    "contentTheme" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "organicViews" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "cpmJpy" REAL,
    "cpmUsd" REAL,
    "cpeJpy" REAL,
    "cpeUsd" REAL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collaboration_kolId_fkey" FOREIGN KEY ("kolId") REFERENCES "Kol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Collaboration" ("comments", "contentTheme", "createdAt", "currency", "feature", "id", "kolId", "likes", "notes", "platform", "postUrl", "price", "publishedAt", "shares", "updatedAt", "views") SELECT "comments", "contentTheme", "createdAt", "currency", "feature", "id", "kolId", "likes", "notes", "platform", "postUrl", "price", "publishedAt", "shares", "updatedAt", "views" FROM "Collaboration";
DROP TABLE "Collaboration";
ALTER TABLE "new_Collaboration" RENAME TO "Collaboration";
CREATE INDEX "Collaboration_publishedAt_idx" ON "Collaboration"("publishedAt");
CREATE INDEX "Collaboration_feature_idx" ON "Collaboration"("feature");
CREATE INDEX "Collaboration_contentTheme_idx" ON "Collaboration"("contentTheme");
CREATE INDEX "Collaboration_platform_idx" ON "Collaboration"("platform");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
