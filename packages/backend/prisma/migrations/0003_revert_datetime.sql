-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "multiplePt" REAL NOT NULL DEFAULT 1.0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EventMatch" ("createdAt", "endDate", "id", "multiplePt", "startDate", "updatedAt") SELECT "createdAt", "endDate", "id", "multiplePt", "startDate", "updatedAt" FROM "EventMatch";
DROP TABLE "EventMatch";
ALTER TABLE "new_EventMatch" RENAME TO "EventMatch";
CREATE TABLE "new_Record" (
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
INSERT INTO "new_Record" ("createdAt", "id", "matchDateId", "noteId", "place", "postedAt", "updatedAt", "userId") SELECT "createdAt", "id", "matchDateId", "noteId", "place", "postedAt", "updatedAt", "userId" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
CREATE UNIQUE INDEX "Record_noteId_key" ON "Record"("noteId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userName" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("banned", "createdAt", "id", "updatedAt", "userName") SELECT "banned", "createdAt", "id", "updatedAt", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE TABLE "new_UserRankHistory" (
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
INSERT INTO "new_UserRankHistory" ("createdAt", "earnedPt", "id", "matchId", "pt", "updatedAt", "userId") SELECT "createdAt", "earnedPt", "id", "matchId", "pt", "updatedAt", "userId" FROM "UserRankHistory";
DROP TABLE "UserRankHistory";
ALTER TABLE "new_UserRankHistory" RENAME TO "UserRankHistory";
CREATE TABLE "new_UserRankStatus" (
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
INSERT INTO "new_UserRankStatus" ("createdAt", "id", "protectCoolTime", "pt", "streakAbsenceAt", "streakFlyingAt", "streakParticipationAt", "streakWithinTopAt", "updatedAt") SELECT "createdAt", "id", "protectCoolTime", "pt", "streakAbsenceAt", "streakFlyingAt", "streakParticipationAt", "streakWithinTopAt", "updatedAt" FROM "UserRankStatus";
DROP TABLE "UserRankStatus";
ALTER TABLE "new_UserRankStatus" RENAME TO "UserRankStatus";
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "showLeaderboardRank" BOOLEAN NOT NULL DEFAULT true,
    "showLeaderboardRanking" BOOLEAN NOT NULL DEFAULT true,
    "showProfileStats" BOOLEAN NOT NULL DEFAULT true,
    "showProfileSearch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("createdAt", "id", "showLeaderboardRank", "showLeaderboardRanking", "showProfileSearch", "showProfileStats", "updatedAt") SELECT "createdAt", "id", "showLeaderboardRank", "showLeaderboardRanking", "showProfileSearch", "showProfileStats", "updatedAt" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
