/*
 * Authors: Kevin Sirantoine
 * Created: 2025-09-25
 * Updated: 2025-10-06
 *
 * This file contains and exports all SQL statements used by sqlite-db.
 *
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
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
    colorCode INT,
    folderName CHAR(24) NOT NULL
  )`;

export const createDeletedTable = `
  CREATE TABLE IF NOT EXISTS deleted (
    itemID BIGINT PRIMARY KEY,
    lastModified BIGINT NOT NULL,
    itemTable SMALLINT NOT NULL
  )`;

// Example SQL
export const createExTable = `
  CREATE TABLE IF NOT EXISTS example (
    id VARCHAR(32),
    value VARCHAR(32)
  )`;

export const createExEntry = "INSERT INTO example (id, value) VALUES (?, ?)";
export const readExEntry = "SELECT value FROM example WHERE id = ?";
export const updateExEntry = "UPDATE example SET value = ? WHERE id = ?";
export const deleteExEntry = "DELETE FROM example WHERE id = ?";
