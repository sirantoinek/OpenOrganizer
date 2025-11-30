/*
 * Authors: Kevin Sirantoine
 * Created: 2025-09-25
 * Updated: 2025-11-28
 *
 * This file contains and exports all SQL statements used by sqlite-db.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

// Table creation SQL
export const createNotesTable = `
  CREATE TABLE IF NOT EXISTS notes (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    isExtended BOOLEAN NOT NULL,
    title CHAR(48) NOT NULL,
    text CHAR(64) NOT NULL,
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createRemindersTable = `
  CREATE TABLE IF NOT EXISTS reminders (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    eventType INT NOT NULL,
    eventStartYear INT NOT NULL,
    eventStartDay SMALLINT NOT NULL,
    eventStartMin SMALLINT NOT NULL,
    eventEndYear INT NOT NULL,
    eventEndDay SMALLINT NOT NULL,
    eventEndMin SMALLINT NOT NULL,
    notifYear INT NOT NULL,
    notifDay SMALLINT NOT NULL,
    notifMin SMALLINT NOT NULL,
    isExtended BOOLEAN NOT NULL,
    hasNotif BOOLEAN NOT NULL,
    title CHAR(48) NOT NULL,
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createDailyTable = `
  CREATE TABLE IF NOT EXISTS daily_reminders (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    eventType INT NOT NULL,
    seriesStartYear INT NOT NULL,
    seriesStartDay SMALLINT NOT NULL,
    seriesStartMin SMALLINT NOT NULL,
    seriesEndYear INT NOT NULL,
    seriesEndDay SMALLINT NOT NULL,
    seriesEndMin SMALLINT NOT NULL,
    timeOfDayMin SMALLINT NOT NULL,
    eventDurationMin INT NOT NULL,
    notifOffsetTimeMin INT NOT NULL,
    hasNotifs BOOLEAN NOT NULL,
    isExtended BOOLEAN NOT NULL,
    everyNDays SMALLINT NOT NULL,
    title CHAR(48) NOT NULL,
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createWeeklyTable = `
  CREATE TABLE IF NOT EXISTS weekly_reminders (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    eventType INT NOT NULL,
    seriesStartYear INT NOT NULL,
    seriesStartDay SMALLINT NOT NULL,
    seriesStartMin SMALLINT NOT NULL,
    seriesEndYear INT NOT NULL,
    seriesEndDay SMALLINT NOT NULL,
    seriesEndMin SMALLINT NOT NULL,
    timeOfDayMin SMALLINT NOT NULL,
    eventDurationMin INT NOT NULL,
    notifOffsetTimeMin INT NOT NULL,
    hasNotifs BOOLEAN NOT NULL,
    isExtended BOOLEAN NOT NULL,
    everyNWeeks SMALLINT NOT NULL,
    daysOfWeek CHAR(7) NOT NULL,
    title CHAR(48) NOT NULL,
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createMonthlyTable = `
  CREATE TABLE IF NOT EXISTS monthly_reminders (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    eventType INT NOT NULL,
    seriesStartYear INT NOT NULL,
    seriesStartDay SMALLINT NOT NULL,
    seriesStartMin SMALLINT NOT NULL,
    seriesEndYear INT NOT NULL,
    seriesEndDay SMALLINT NOT NULL,
    seriesEndMin SMALLINT NOT NULL,
    timeOfDayMin SMALLINT NOT NULL,
    eventDurationMin INT NOT NULL,
    notifOffsetTimeMin INT NOT NULL,
    hasNotifs BOOLEAN NOT NULL,
    isExtended BOOLEAN NOT NULL,
    lastDayOfMonth BOOLEAN NOT NULL,
    daysOfMonth CHAR(31) NOT NULL,
    title CHAR(48) NOT NULL,
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createYearlyTable = `
  CREATE TABLE IF NOT EXISTS yearly_reminders (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    eventType INT NOT NULL,
    seriesStartYear INT NOT NULL,
    seriesStartDay SMALLINT NOT NULL,
    seriesStartMin SMALLINT NOT NULL,
    seriesEndYear INT NOT NULL,
    seriesEndDay SMALLINT NOT NULL,
    seriesEndMin SMALLINT NOT NULL,
    timeOfDayMin SMALLINT NOT NULL,
    eventDurationMin INT NOT NULL,
    notifOffsetTimeMin INT NOT NULL,
    hasNotifs BOOLEAN NOT NULL,
    isExtended BOOLEAN NOT NULL,
    dayOfYear SMALLINT NOT NULL,
    title CHAR(48) NOT NULL,
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createGeneratedTable = `
  CREATE TABLE IF NOT EXISTS generated_reminders (
    itemID BIGINT NOT NULL,
    folderID BIGINT NOT NULL,
    eventType INT NOT NULL,
    recurrenceTable SMALLINT NOT NULL,
    origEventStartYear INT NOT NULL,
    origEventStartDay SMALLINT NOT NULL,
    origEventStartMin SMALLINT NOT NULL,
    eventStartYear INT NOT NULL,
    eventStartDay SMALLINT NOT NULL,
    eventStartMin SMALLINT NOT NULL,
    eventEndYear INT NOT NULL,
    eventEndDay SMALLINT NOT NULL,
    eventEndMin SMALLINT NOT NULL,
    notifYear INT NOT NULL,
    notifDay SMALLINT NOT NULL,
    notifMin SMALLINT NOT NULL,
    isExtended BOOLEAN NOT NULL,
    hasNotif BOOLEAN NOT NULL,
    title CHAR(48) NOT NULL,
    PRIMARY KEY (itemID, origEventStartYear, origEventStartDay, origEventStartMin),
    FOREIGN KEY (folderID) REFERENCES folders(folderID)
  )`;

export const createExtensionsTable = `
  CREATE TABLE IF NOT EXISTS extensions (
    itemID BIGINT NOT NULL,
    sequenceNum INT NOT NULL,
    lastModified BIGINT NOT NULL,
    data CHAR(64),
    PRIMARY KEY (itemID, sequenceNum)
  )`;

export const createOverridesTable = `
  CREATE TABLE IF NOT EXISTS overrides (
    itemID BIGINT PRIMARY KEY,
    linkedItemID BIGINT NOT NULL,
    lastModified BIGINT NOT NULL,
    origEventStartYear INT NOT NULL,
    origEventStartDay SMALLINT NOT NULL,
    origEventStartMin SMALLINT NOT NULL,
    eventStartYear INT,
    eventStartDay SMALLINT,
    eventStartMin SMALLINT,
    eventEndYear INT,
    eventEndDay SMALLINT,
    eventEndMin SMALLINT,
    notifYear INT,
    notifDay SMALLINT,
    notifMin SMALLINT,
    hasNotif BOOLEAN
  )`;

export const createFoldersTable = `
  CREATE TABLE IF NOT EXISTS folders (
    folderID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    parentFolderID BIGINT NOT NULL,
    colorCode INT NOT NULL,
    folderName CHAR(24) NOT NULL
  )`;

export const createDeletedTable = `
  CREATE TABLE IF NOT EXISTS deleted (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    itemTable SMALLINT NOT NULL
  )`;

// Table deletion SQL
export const dropNotesTable = `
DROP TABLE IF EXISTS notes`;

export const dropRemindersTable = `
DROP TABLE IF EXISTS reminders`;

export const dropDailyTable = `
DROP TABLE IF EXISTS daily_reminders`;

export const dropWeeklyTable = `
DROP TABLE IF EXISTS weekly_reminders`;

export const dropMonthlyTable = `
DROP TABLE IF EXISTS monthly_reminders`;

export const dropYearlyTable = `
DROP TABLE IF EXISTS yearly_reminders`;

export const dropGeneratedTable = `
DROP TABLE IF EXISTS generated_reminders`;

export const dropExtensionsTable = `
DROP TABLE IF EXISTS extensions`;

export const dropOverridesTable = `
DROP TABLE IF EXISTS overrides`;

export const dropFoldersTable = `
DROP TABLE IF EXISTS folders`;

export const dropDeletedTable = `
DROP TABLE IF EXISTS deleted`;

// create entry SQL statements

export const createNoteStmt = `
INSERT INTO notes (itemID, lastModified, folderID, isExtended, title, text)
VALUES (?, ?, ?, ?, ?, ?)`;

export const createReminderStmt = `
INSERT INTO reminders (
  itemID, lastModified, folderID, eventType, eventStartYear, eventStartDay, eventStartMin, eventEndYear, eventEndDay,
  eventEndMin, notifYear, notifDay, notifMin, isExtended, hasNotif, title)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const createDailyReminderStmt = `
INSERT INTO daily_reminders (
  itemID, lastModified, folderID, eventType, seriesStartYear, seriesStartDay, seriesStartMin, seriesEndYear, seriesEndDay,
  seriesEndMin, timeOfDayMin, eventDurationMin, notifOffsetTimeMin, hasNotifs, isExtended, everyNDays, title)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const createWeeklyReminderStmt = `
INSERT INTO weekly_reminders (
  itemID, lastModified, folderID, eventType, seriesStartYear, seriesStartDay, seriesStartMin, seriesEndYear, seriesEndDay,
  seriesEndMin, timeOfDayMin, eventDurationMin, notifOffsetTimeMin, hasNotifs, isExtended, everyNWeeks, daysOfWeek, title)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const createMonthlyReminderStmt = `
INSERT INTO monthly_reminders (
  itemID, lastModified, folderID, eventType, seriesStartYear, seriesStartDay, seriesStartMin, seriesEndYear, seriesEndDay,
  seriesEndMin, timeOfDayMin, eventDurationMin, notifOffsetTimeMin, hasNotifs, isExtended, lastDayOfMonth, daysOfMonth, title)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const createYearlyReminderStmt = `
INSERT INTO yearly_reminders (
  itemID, lastModified, folderID, eventType, seriesStartYear, seriesStartDay, seriesStartMin, seriesEndYear, seriesEndDay,
  seriesEndMin, timeOfDayMin, eventDurationMin, notifOffsetTimeMin, hasNotifs, isExtended, dayOfYear, title)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const createOrUpdateGeneratedRemindersStmt = `
REPLACE INTO generated_reminders (
  itemID, folderID, eventType, recurrenceTable, origEventStartYear, origEventStartDay, origEventStartMin, eventStartYear, eventStartDay,
  eventStartMin, eventEndYear, eventEndDay, eventEndMin, notifYear, notifDay, notifMin, isExtended, hasNotif, title)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // REPLACE is equivalent to "INSERT OR REPLACE'

export const createExtensionStmt = `
INSERT INTO extensions (itemID, sequenceNum, lastModified, data)
VALUES (?, ?, ?, ?)`;

export const createOrUpdateOverrideStmt = `
REPLACE INTO overrides (
  itemID, linkedItemID, lastModified, origEventStartYear, origEventStartDay, origEventStartMin, eventStartYear, eventStartDay,
  eventStartMin, eventEndYear, eventEndDay, eventEndMin, notifYear, notifDay, notifMin, hasNotif)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // REPLACE is equivalent to "INSERT OR REPLACE'

export const createFolderStmt = `
INSERT INTO folders (folderID, lastModified, parentFolderID, colorCode, folderName)
VALUES (?, ?, ?, ?, ?)`;

export const createDeletedStmt = `
  INSERT INTO deleted (itemID, lastModified, itemTable)
  VALUES (?, ?, ?)`;

// read entry SQL statements

export const readNoteStmt = `
SELECT * FROM notes
WHERE itemID = ?`;

export const readReminderStmt = `
SELECT * FROM reminders
WHERE itemID = ?`;

export const readDailyReminderStmt = `
SELECT * FROM daily_reminders
WHERE itemID = ?`;

export const readWeeklyReminderStmt = `
SELECT * FROM weekly_reminders
WHERE itemID = ?`;

export const readMonthlyReminderStmt = `
SELECT * FROM monthly_reminders
WHERE itemID = ?`;

export const readYearlyReminderStmt = `
SELECT * FROM yearly_reminders
WHERE itemID = ?`;

export const readGeneratedReminderStmt = `
SELECT * FROM generated_reminders
WHERE itemID = ? AND origEventStartYear = ? AND origEventStartDay = ? AND origEventStartMin = ?`;

export const readExtensionsStmt = `
SELECT * FROM extensions
WHERE itemID = ?
ORDER BY sequenceNum ASC`;

export const readOverridesStmt = `
SELECT * FROM overrides
WHERE linkedItemID = ?`;

export const readFolderStmt = `
SELECT * FROM folders
WHERE folderID = ?`;

export const readGeneratedsStmt = `
SELECT * FROM generated_reminders
WHERE itemID = ?`;

// read in range

export const readNotesInRangeStmt = `
SELECT * FROM notes
WHERE (itemID <= $windowEndMs AND itemID >= $windowStartMs)`;

export const readRemindersInRangeStmt = `
SELECT * FROM reminders
WHERE (
  ((eventStartYear < $windowEndYear) OR (eventStartYear = $windowEndYear AND ((eventStartDay * 1440 + eventStartMin) <= $windowEndMinOfYear)))
  AND
  ((eventEndYear > $windowStartYear) OR (eventEndYear = $windowStartYear AND ((eventEndDay * 1440 + eventEndMin) >= $windowStartMinOfYear)))
)
ORDER BY itemID ASC`;

export const readDailyRemindersInRangeStmt = `
SELECT * FROM daily_reminders
WHERE (
  ((seriesStartYear < $windowEndYear) OR (seriesStartYear = $windowEndYear AND ((seriesStartDay * 1440 + seriesStartMin) <= $windowEndMinOfYear)))
  AND
  ((seriesEndYear > $windowStartYear) OR (seriesEndYear = $windowStartYear AND ((seriesEndDay * 1440 + seriesEndMin) >= $windowStartMinOfYear)))
)
ORDER BY itemID ASC`;

export const readWeeklyRemindersInRangeStmt = `
SELECT * FROM weekly_reminders
WHERE (
  ((seriesStartYear < $windowEndYear) OR (seriesStartYear = $windowEndYear AND ((seriesStartDay * 1440 + seriesStartMin) <= $windowEndMinOfYear)))
  AND
  ((seriesEndYear > $windowStartYear) OR (seriesEndYear = $windowStartYear AND ((seriesEndDay * 1440 + seriesEndMin) >= $windowStartMinOfYear)))
)
ORDER BY itemID ASC`;

export const readMonthlyRemindersInRangeStmt = `
SELECT * FROM monthly_reminders
WHERE (
  ((seriesStartYear < $windowEndYear) OR (seriesStartYear = $windowEndYear AND ((seriesStartDay * 1440 + seriesStartMin) <= $windowEndMinOfYear)))
  AND
  ((seriesEndYear > $windowStartYear) OR (seriesEndYear = $windowStartYear AND ((seriesEndDay * 1440 + seriesEndMin) >= $windowStartMinOfYear)))
)
ORDER BY itemID ASC`;

export const readYearlyRemindersInRangeStmt = `
SELECT * FROM yearly_reminders
WHERE (
  ((seriesStartYear < $windowEndYear) OR (seriesStartYear = $windowEndYear AND ((seriesStartDay * 1440 + seriesStartMin) <= $windowEndMinOfYear)))
  AND
  ((seriesEndYear > $windowStartYear) OR (seriesEndYear = $windowStartYear AND ((seriesEndDay * 1440 + seriesEndMin) >= $windowStartMinOfYear)))
)
ORDER BY itemID ASC`;

export const readGeneratedRemindersInRangeStmt = `
SELECT * FROM generated_reminders
WHERE (
  ((eventStartYear < $windowEndYear) OR (eventStartYear = $windowEndYear AND ((eventStartDay * 1440 + eventStartMin) <= $windowEndMinOfYear)))
  AND
  ((eventEndYear > $windowStartYear) OR (eventEndYear = $windowStartYear AND ((eventEndDay * 1440 + eventEndMin) >= $windowStartMinOfYear)))
)
ORDER BY itemID ASC`;

// read all

export const readAllFoldersStmt = `
SELECT * FROM folders`;

// read all modified after a given timestamp

export const readNotesAfterStmt = `
SELECT * FROM notes
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readRemindersAfterStmt = `
SELECT * FROM reminders
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readDailyRemindersAfterStmt = `
SELECT * FROM daily_reminders
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readWeeklyRemindersAfterStmt = `
SELECT * FROM weekly_reminders
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readMonthlyRemindersAfterStmt = `
SELECT * FROM monthly_reminders
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readYearlyRemindersAfterStmt = `
SELECT * FROM yearly_reminders
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readExtensionsAfterStmt = `
SELECT * FROM extensions
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readOverridesAfterStmt = `
SELECT * FROM overrides
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readFoldersAfterStmt = `
SELECT * FROM folders
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

export const readDeletesAfterStmt = `
SELECT * FROM deleted
WHERE (lastModified > ?)
ORDER BY lastModified ASC`;

// get IDs based on folderID

export const readNotesInFolderStmt = `
SELECT itemID FROM notes
WHERE folderID = ?`;

export const readRemindersInFolderStmt = `
SELECT itemID FROM reminders
WHERE folderID = ?`;

export const readDailyRemindersInFolderStmt = `
SELECT itemID FROM daily_reminders
WHERE folderID = ?`;

export const readWeeklyRemindersInFolderStmt = `
SELECT itemID FROM weekly_reminders
WHERE folderID = ?`;

export const readMonthlyRemindersInFolderStmt = `
SELECT itemID FROM monthly_reminders
WHERE folderID = ?`;

export const readYearlyRemindersInFolderStmt = `
SELECT itemID FROM yearly_reminders
WHERE folderID = ?`;

export const readFoldersInFolderStmt = `
SELECT folderID FROM folders
WHERE parentFolderID = ?`;

// read lastModified based on itemID (used in syncing)

export const readNoteLmStmt = `
SELECT lastModified FROM notes
WHERE itemID = ?`;

export const readReminderLmStmt = `
SELECT lastModified FROM reminders
WHERE itemID = ?`;

export const readDailyReminderLmStmt = `
SELECT lastModified FROM daily_reminders
WHERE itemID = ?`;

export const readWeeklyReminderLmStmt = `
SELECT lastModified FROM weekly_reminders
WHERE itemID = ?`;

export const readMonthlyReminderLmStmt = `
SELECT lastModified FROM monthly_reminders
WHERE itemID = ?`;

export const readYearlyReminderLmStmt = `
SELECT lastModified FROM yearly_reminders
WHERE itemID = ?`;

export const readExtensionLmStmt = `
SELECT lastModified FROM extensions
WHERE itemID = ? AND sequenceNum = ?`;

export const readOverrideLmStmt = `
SELECT lastModified FROM overrides
WHERE itemID = ?`;

export const readFolderLmStmt = `
SELECT lastModified FROM folders
WHERE folderID = ?`;

export const readDeletedLmStmt = `
SELECT lastModified FROM deleted
WHERE itemID = ?`;

export const readGeneratedReminderIDInYearStmt = `
SELECT itemID FROM generated_reminders
WHERE eventStartYear = ?`;

export const readOverrideIDStmt = `
SELECT itemID FROM overrides
WHERE linkedItemID = ? AND origEventStartYear = ? AND origEventStartDay = ? AND origEventStartMin = ?`;

// update entry SQL statements

export const updateNoteStmt = `
UPDATE notes
SET lastModified = ?, folderID = ?, isExtended = ?, title = ?, text = ?
WHERE itemID = ?`;

export const updateReminderStmt = `
UPDATE reminders
SET lastModified = ?, folderID = ?, eventType = ?, eventStartYear = ?, eventStartDay = ?, eventStartMin = ?, eventEndYear = ?, eventEndDay = ?,
    eventEndMin = ?, notifYear = ?, notifDay = ?, notifMin = ?, isExtended = ?, hasNotif = ?, title = ?
WHERE itemID = ?`;

export const updateDailyReminderStmt = `
UPDATE daily_reminders
SET lastModified = ?, folderID = ?, eventType = ?, seriesStartYear = ?, seriesStartDay = ?, seriesStartMin = ?, seriesEndYear = ?, seriesEndDay = ?,
    seriesEndMin = ?, timeOfDayMin = ?, eventDurationMin = ?, notifOffsetTimeMin = ?, hasNotifs = ?, isExtended = ?, everyNDays = ?, title = ?
WHERE itemID = ?`;

export const updateWeeklyReminderStmt = `
UPDATE weekly_reminders
SET lastModified = ?, folderID = ?, eventType = ?, seriesStartYear = ?, seriesStartDay = ?, seriesStartMin = ?, seriesEndYear = ?, seriesEndDay = ?,
    seriesEndMin = ?, timeOfDayMin = ?, eventDurationMin = ?, notifOffsetTimeMin = ?, hasNotifs = ?, isExtended = ?, everyNWeeks = ?, daysOfWeek = ?, title = ?
WHERE itemID = ?`;

export const updateMonthlyReminderStmt = `
UPDATE monthly_reminders
SET lastModified = ?, folderID = ?, eventType = ?, seriesStartYear = ?, seriesStartDay = ?, seriesStartMin = ?, seriesEndYear = ?, seriesEndDay = ?,
    seriesEndMin = ?, timeOfDayMin = ?, eventDurationMin = ?, notifOffsetTimeMin = ?, hasNotifs = ?, isExtended = ?, lastDayOfMonth = ?, daysOfMonth = ?, title = ?
WHERE itemID = ?`;

export const updateYearlyReminderStmt = `
UPDATE yearly_reminders
SET lastModified = ?, folderID = ?, eventType = ?, seriesStartYear = ?, seriesStartDay = ?, seriesStartMin = ?, seriesEndYear = ?, seriesEndDay = ?,
    seriesEndMin = ?, timeOfDayMin = ?, eventDurationMin = ?, notifOffsetTimeMin = ?, hasNotifs = ?, isExtended = ?, dayOfYear = ?, title = ?
WHERE itemID = ?`;

export const updateFolderStmt = `
UPDATE folders
SET lastModified = ?, parentFolderID = ?, colorCode = ?, folderName = ?
WHERE folderID = ?`;

// delete entry SQL statements

export const deleteNoteStmt = `
DELETE FROM notes
WHERE itemID = ?`;

export const deleteReminderStmt = `
DELETE FROM reminders
WHERE itemID = ?`;

export const deleteDailyReminderStmt = `
DELETE FROM daily_reminders
WHERE itemID = ?`;

export const deleteWeeklyReminderStmt = `
DELETE FROM weekly_reminders
WHERE itemID = ?`;

export const deleteMonthlyReminderStmt = `
DELETE FROM monthly_reminders
WHERE itemID = ?`;

export const deleteYearlyReminderStmt = `
DELETE FROM yearly_reminders
WHERE itemID = ?`;

export const deleteExtensionStmt = `
DELETE FROM extensions
WHERE itemID = ? AND sequenceNum = ?`;

export const deleteAllExtensionsStmt = `
DELETE FROM extensions
WHERE itemID = ?`;

export const deleteFolderStmt = `
DELETE FROM folders
WHERE folderID = ?`;

export const deleteGeneratedRemindersOutsideYearRangeStmt = `
DELETE FROM generated_reminders
WHERE (eventStartYear < ?) OR (eventStartYear > ?)`;

export const deleteGeneratedRemindersByIdStmt = `
DELETE FROM generated_reminders
WHERE itemID = ?`;

export const deleteOverridesByLinkedIdStmt = `
DELETE FROM overrides
WHERE linkedItemID = ?`;
