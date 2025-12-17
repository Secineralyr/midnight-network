-- CreateTable
CREATE TABLE "Record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noteId" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "matchDateId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_matchDateId_fkey" FOREIGN KEY ("matchDateId") REFERENCES "MatchDate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "multiplePt" REAL NOT NULL DEFAULT 1.0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MatchDate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "eventId" INTEGER,
    CONSTRAINT "MatchDate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EventMatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRankStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pt" INTEGER NOT NULL DEFAULT 0,
    "streakParticipationAt" INTEGER NOT NULL DEFAULT 0,
    "streakAbsenceAt" INTEGER NOT NULL DEFAULT 0,
    "streakWithinTopAt" INTEGER NOT NULL DEFAULT 0,
    "streakFlyingAt" INTEGER NOT NULL DEFAULT 0,
    "protectCoolTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserRankStatus_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRankHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "pt" INTEGER NOT NULL DEFAULT 0,
    "earnedPt" INTEGER NOT NULL DEFAULT 0,
    "matchId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserRankHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRankHistory_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchDate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showRank" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboardRank" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboardRanking" BOOLEAN NOT NULL DEFAULT true,
    "showProfileStats" BOOLEAN NOT NULL DEFAULT true,
    "showProfileSearch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_noteId_key" ON "Record"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDate_date_key" ON "MatchDate"("date");
