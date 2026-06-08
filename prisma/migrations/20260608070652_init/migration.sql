-- CreateTable
CREATE TABLE "Kol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" TEXT,
    "followers" INTEGER,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kolId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "feature" TEXT NOT NULL,
    "contentTheme" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collaboration_kolId_fkey" FOREIGN KEY ("kolId") REFERENCES "Kol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "rowsTotal" INTEGER NOT NULL,
    "rowsAdded" INTEGER NOT NULL,
    "rowsUpdated" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Kol_name_idx" ON "Kol"("name");

-- CreateIndex
CREATE INDEX "Kol_platform_idx" ON "Kol"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "Kol_handle_platform_key" ON "Kol"("handle", "platform");

-- CreateIndex
CREATE INDEX "Collaboration_publishedAt_idx" ON "Collaboration"("publishedAt");

-- CreateIndex
CREATE INDEX "Collaboration_feature_idx" ON "Collaboration"("feature");

-- CreateIndex
CREATE INDEX "Collaboration_contentTheme_idx" ON "Collaboration"("contentTheme");

-- CreateIndex
CREATE INDEX "Collaboration_platform_idx" ON "Collaboration"("platform");
