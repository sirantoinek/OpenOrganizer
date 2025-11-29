/*
 * Authors: Kevin Sirantoine, Rachel Patella
 * Created: 2025-09-10
 * Updated: 2025-11-16
 *
 * This file initializes the SQLite database, prepares queries, and exports functions for interacting with the
 * SQLite database.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as gen from "app/src-electron/services/generate";
import * as sql from "./sql";
import type {
  Note,
  Extension,
  Folder,
  Reminder,
  DailyReminder,
  WeeklyReminder,
  MonthlyReminder,
  YearlyReminder,
  GeneratedReminder,
  Override,
  Deleted,
  RangeWindow
} from "app/src-electron/types/shared-types";

// local.db located in ..\AppData\Roaming\Electron
const dbPath = path.join(app.getPath('userData'), 'local.db');
const db = new Database(dbPath);

// Create tables if not exists
createTables();

// prepare all sql queries once

// create

const createNoteStmt = db.prepare(sql.createNoteStmt);
const createReminderStmt = db.prepare(sql.createReminderStmt);
const createDailyReminderStmt = db.prepare(sql.createDailyReminderStmt);
const createWeeklyReminderStmt = db.prepare(sql.createWeeklyReminderStmt);
const createMonthlyReminderStmt = db.prepare(sql.createMonthlyReminderStmt);
const createYearlyReminderStmt = db.prepare(sql.createYearlyReminderStmt);
const createOrUpdateGeneratedRemindersStmt = db.prepare(sql.createOrUpdateGeneratedRemindersStmt);
const createExtensionStmt = db.prepare(sql.createExtensionStmt);
const createOrUpdateOverrideStmt = db.prepare(sql.createOrUpdateOverrideStmt);
const createFolderStmt = db.prepare(sql.createFolderStmt);
const createDeletedStmt = db.prepare(sql.createDeletedStmt);

// read

const readNoteStmt = db.prepare(sql.readNoteStmt);
const readReminderStmt = db.prepare(sql.readReminderStmt);
const readDailyReminderStmt = db.prepare(sql.readDailyReminderStmt);
const readWeeklyReminderStmt = db.prepare(sql.readWeeklyReminderStmt);
const readMonthlyReminderStmt = db.prepare(sql.readMonthlyReminderStmt);
const readYearlyReminderStmt = db.prepare(sql.readYearlyReminderStmt);
const readGeneratedReminderStmt = db.prepare(sql.readGeneratedReminderStmt);
const readOverridesStmt = db.prepare(sql.readOverridesStmt);
const readExtensionsStmt = db.prepare(sql.readExtensionsStmt);
const readFolderStmt = db.prepare(sql.readFolderStmt);
const readGeneratedsStmt = db.prepare(sql.readGeneratedsStmt);

const readNotesInRangeStmt = db.prepare(sql.readNotesInRangeStmt);
const readRemindersInRangeStmt = db.prepare(sql.readRemindersInRangeStmt);
const readDailyRemindersInRangeStmt = db.prepare(sql.readDailyRemindersInRangeStmt);
const readWeeklyRemindersInRangeStmt = db.prepare(sql.readWeeklyRemindersInRangeStmt);
const readMonthlyRemindersInRangeStmt = db.prepare(sql.readMonthlyRemindersInRangeStmt);
const readYearlyRemindersInRangeStmt = db.prepare(sql.readYearlyRemindersInRangeStmt);
const readGeneratedRemindersInRangeStmt = db.prepare(sql.readGeneratedRemindersInRangeStmt);
const readAllFoldersStmt = db.prepare(sql.readAllFoldersStmt);

const readNotesAfterStmt = db.prepare(sql.readNotesAfterStmt);
const readRemindersAfterStmt = db.prepare(sql.readRemindersAfterStmt);
const readDailyRemindersAfterStmt = db.prepare(sql.readDailyRemindersAfterStmt);
const readWeeklyRemindersAfterStmt = db.prepare(sql.readWeeklyRemindersAfterStmt);
const readMonthlyRemindersAfterStmt = db.prepare(sql.readMonthlyRemindersAfterStmt);
const readYearlyRemindersAfterStmt = db.prepare(sql.readYearlyRemindersAfterStmt);
const readExtensionsAfterStmt = db.prepare(sql.readExtensionsAfterStmt);
const readOverridesAfterStmt = db.prepare(sql.readOverridesAfterStmt);
const readFoldersAfterStmt = db.prepare(sql.readFoldersAfterStmt);
const readDeletesAfterStmt = db.prepare(sql.readDeletesAfterStmt);

const readNotesInFolderStmt = db.prepare(sql.readNotesInFolderStmt);
const readRemindersInFolderStmt = db.prepare(sql.readRemindersInFolderStmt);
const readDailyRemindersInFolderStmt = db.prepare(sql.readDailyRemindersInFolderStmt);
const readWeeklyRemindersInFolderStmt = db.prepare(sql.readWeeklyRemindersInFolderStmt);
const readMonthlyRemindersInFolderStmt = db.prepare(sql.readMonthlyRemindersInFolderStmt);
const readYearlyRemindersInFolderStmt = db.prepare(sql.readYearlyRemindersInFolderStmt);
const readFoldersInFolderStmt = db.prepare(sql.readFoldersInFolderStmt);

const readNoteLmStmt = db.prepare(sql.readNoteLmStmt);
const readReminderLmStmt = db.prepare(sql.readReminderLmStmt);
const readDailyReminderLmStmt = db.prepare(sql.readDailyReminderLmStmt);
const readWeeklyReminderLmStmt = db.prepare(sql.readWeeklyReminderLmStmt);
const readMonthlyReminderLmStmt = db.prepare(sql.readMonthlyReminderLmStmt);
const readYearlyReminderLmStmt = db.prepare(sql.readYearlyReminderLmStmt);
const readExtensionLmStmt = db.prepare(sql.readExtensionLmStmt);
const readOverrideLmStmt = db.prepare(sql.readOverrideLmStmt);
const readFolderLmStmt = db.prepare(sql.readFolderLmStmt);
const readDeletedLmStmt = db.prepare(sql.readDeletedLmStmt);

const readGeneratedReminderIDInYearStmt = db.prepare(sql.readGeneratedReminderIDInYearStmt);
const readOverrideIDStmt = db.prepare(sql.readOverrideIDStmt);

// update

const updateNoteStmt = db.prepare(sql.updateNoteStmt);
const updateReminderStmt = db.prepare(sql.updateReminderStmt);
const updateDailyReminderStmt = db.prepare(sql.updateDailyReminderStmt);
const updateWeeklyReminderStmt = db.prepare(sql.updateWeeklyReminderStmt);
const updateMonthlyReminderStmt = db.prepare(sql.updateMonthlyReminderStmt);
const updateYearlyReminderStmt = db.prepare(sql.updateYearlyReminderStmt);
const updateFolderStmt = db.prepare(sql.updateFolderStmt);

//delete

const deleteNoteStmt = db.prepare(sql.deleteNoteStmt);
const deleteReminderStmt = db.prepare(sql.deleteReminderStmt);
const deleteDailyReminderStmt = db.prepare(sql.deleteDailyReminderStmt);
const deleteWeeklyReminderStmt = db.prepare(sql.deleteWeeklyReminderStmt);
const deleteMonthlyReminderStmt = db.prepare(sql.deleteMonthlyReminderStmt);
const deleteYearlyReminderStmt = db.prepare(sql.deleteYearlyReminderStmt);
const deleteExtensionStmt = db.prepare(sql.deleteExtensionStmt);
const deleteAllExtensionsStmt = db.prepare(sql.deleteAllExtensionsStmt);
const deleteFolderStmt = db.prepare(sql.deleteFolderStmt);

const deleteGeneratedRemindersOutsideYearRangeStmt = db.prepare(sql.deleteGeneratedRemindersOutsideYearRangeStmt);
const deleteGeneratedRemindersByIdStmt = db.prepare(sql.deleteGeneratedRemindersByIdStmt);
const deleteOverridesByLinkedIdStmt = db.prepare(sql.deleteOverridesByLinkedIdStmt);

// Table CRUD functions:

// create

export function createNote(newNote: Note) {
  createNoteStmt.run(newNote.itemID, newNote.lastModified, newNote.folderID, newNote.isExtended, newNote.title, newNote.text);
  if (newNote.extensions !== undefined) for (const ext of newNote.extensions) createExtension(ext);
}

export function createReminder(newRem: Reminder) {
  createReminderStmt.run(
    newRem.itemID, newRem.lastModified, newRem.folderID, newRem.eventType, newRem.eventStartYear, newRem.eventStartDay,
    newRem.eventStartMin, newRem.eventEndYear, newRem.eventEndDay, newRem.eventEndMin, newRem.notifYear,
    newRem.notifDay, newRem.notifMin, newRem.isExtended, newRem.hasNotif, newRem.title
  );
  if (newRem.extensions !== undefined) for (const ext of newRem.extensions) createExtension(ext);
}

export function createDailyReminder(newDailyRem: DailyReminder) {
  createDailyReminderStmt.run(
    newDailyRem.itemID, newDailyRem.lastModified, newDailyRem.folderID, newDailyRem.eventType, newDailyRem.seriesStartYear,
    newDailyRem.seriesStartDay, newDailyRem.seriesStartMin, newDailyRem.seriesEndYear, newDailyRem.seriesEndDay,
    newDailyRem.seriesEndMin, newDailyRem.timeOfDayMin, newDailyRem.eventDurationMin, newDailyRem.notifOffsetTimeMin,
    newDailyRem.hasNotifs, newDailyRem.isExtended, newDailyRem.everyNDays, newDailyRem.title
  );
  if (newDailyRem.extensions !== undefined) for (const ext of newDailyRem.extensions) createExtension(ext);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // maintain generated_reminders table for all generatedYears
    generatedRems.push(...gen.generateDaily(newDailyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function createWeeklyReminder(newWeeklyRem: WeeklyReminder) {
  createWeeklyReminderStmt.run(
    newWeeklyRem.itemID, newWeeklyRem.lastModified, newWeeklyRem.folderID, newWeeklyRem.eventType, newWeeklyRem.seriesStartYear,
    newWeeklyRem.seriesStartDay, newWeeklyRem.seriesStartMin, newWeeklyRem.seriesEndYear, newWeeklyRem.seriesEndDay,
    newWeeklyRem.seriesEndMin, newWeeklyRem.timeOfDayMin, newWeeklyRem.eventDurationMin, newWeeklyRem.notifOffsetTimeMin,
    newWeeklyRem.hasNotifs, newWeeklyRem.isExtended, newWeeklyRem.everyNWeeks, newWeeklyRem.daysOfWeek, newWeeklyRem.title
  );
  if (newWeeklyRem.extensions !== undefined) for (const ext of newWeeklyRem.extensions) createExtension(ext);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // maintain generated_reminders table for all generatedYears
    generatedRems.push(...gen.generateWeekly(newWeeklyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function createMonthlyReminder(newMonthlyRem: MonthlyReminder) {
  createMonthlyReminderStmt.run(
    newMonthlyRem.itemID, newMonthlyRem.lastModified, newMonthlyRem.folderID, newMonthlyRem.eventType, newMonthlyRem.seriesStartYear,
    newMonthlyRem.seriesStartDay, newMonthlyRem.seriesStartMin, newMonthlyRem.seriesEndYear, newMonthlyRem.seriesEndDay,
    newMonthlyRem.seriesEndMin, newMonthlyRem.timeOfDayMin, newMonthlyRem.eventDurationMin, newMonthlyRem.notifOffsetTimeMin,
    newMonthlyRem.hasNotifs, newMonthlyRem.isExtended, newMonthlyRem.lastDayOfMonth, newMonthlyRem.daysOfMonth, newMonthlyRem.title
  );
  if (newMonthlyRem.extensions !== undefined) for (const ext of newMonthlyRem.extensions) createExtension(ext);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // maintain generated_reminders table for all generatedYears
    generatedRems.push(...gen.generateMonthly(newMonthlyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function createYearlyReminder(newYearlyRem: YearlyReminder) {
  createYearlyReminderStmt.run(
    newYearlyRem.itemID, newYearlyRem.lastModified, newYearlyRem.folderID, newYearlyRem.eventType, newYearlyRem.seriesStartYear,
    newYearlyRem.seriesStartDay, newYearlyRem.seriesStartMin, newYearlyRem.seriesEndYear, newYearlyRem.seriesEndDay,
    newYearlyRem.seriesEndMin, newYearlyRem.timeOfDayMin, newYearlyRem.eventDurationMin, newYearlyRem.notifOffsetTimeMin,
    newYearlyRem.hasNotifs, newYearlyRem.isExtended, newYearlyRem.dayOfYear, newYearlyRem.title
  );
  if (newYearlyRem.extensions !== undefined) for (const ext of newYearlyRem.extensions) createExtension(ext);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // maintain generated_reminders table for all generatedYears
    generatedRems.push(...gen.generateYearly(newYearlyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function createOrUpdateGeneratedReminders(newGeneratedRems: GeneratedReminder[]) {
  const createOrUpdateGeneratedReminders = db.transaction((newGeneratedRems: GeneratedReminder[]) => {
    for (const newGeneratedRem of newGeneratedRems) {
      createOrUpdateGeneratedRemindersStmt.run(
        newGeneratedRem.itemID, newGeneratedRem.folderID, newGeneratedRem.eventType, newGeneratedRem.recurrenceTable, newGeneratedRem.origEventStartYear,
        newGeneratedRem.origEventStartDay, newGeneratedRem.origEventStartMin, newGeneratedRem.eventStartYear, newGeneratedRem.eventStartDay,
        newGeneratedRem.eventStartMin, newGeneratedRem.eventEndYear, newGeneratedRem.eventEndDay, newGeneratedRem.eventEndMin,
        newGeneratedRem.notifYear, newGeneratedRem.notifDay, newGeneratedRem.notifMin, newGeneratedRem.isExtended, newGeneratedRem.hasNotif, newGeneratedRem.title
      );
    }
  });
  createOrUpdateGeneratedReminders(newGeneratedRems);
}

export function createExtension(newExt: Extension) {
  createExtensionStmt.run(newExt.itemID, newExt.sequenceNum, newExt.lastModified, newExt.data);
}

export function createOrUpdateOverride(override: Override) {
  createOrUpdateOverrideStmt.run(
    override.itemID, override.linkedItemID, override.lastModified, override.origEventStartYear,
    override.origEventStartDay, override.origEventStartMin, override.eventStartYear, override.eventStartDay,
    override.eventStartMin, override.eventEndYear, override.eventEndDay, override.eventEndMin,
    override.notifYear, override.notifDay, override.notifMin, override.hasNotif
  );

  // if the override's generated reminder is currently loaded, update it
  const generatedRem = [readGeneratedReminderStmt.get(override.linkedItemID, override.origEventStartYear, override.origEventStartDay, override.origEventStartMin) as GeneratedReminder];
  if (generatedRem[0] !== undefined) {
    generatedRem[0].origEventStartYear = override.origEventStartYear;
    generatedRem[0].origEventStartDay = override.origEventStartDay;
    generatedRem[0].origEventStartMin = override.origEventStartMin;
    generatedRem[0].eventStartYear = override.eventStartYear;
    generatedRem[0].eventStartDay = override.eventStartDay;
    generatedRem[0].eventStartMin = override.eventStartMin;
    generatedRem[0].eventEndYear = override.eventEndYear;
    generatedRem[0].eventEndDay = override.eventEndDay;
    generatedRem[0].eventEndMin = override.eventEndMin;
    generatedRem[0].notifYear = override.notifYear;
    generatedRem[0].notifDay = override.notifDay;
    generatedRem[0].notifMin = override.notifMin;
    generatedRem[0].hasNotif = override.hasNotif;
    createOrUpdateGeneratedReminders(generatedRem);
  }
}

export function createFolder(newFolder: Folder) { // -1 treated as no colorCode
  createFolderStmt.run(newFolder.folderID, newFolder.lastModified, newFolder.parentFolderID, newFolder.colorCode, newFolder.folderName);
}

export function createDeleted(newDeleted: Deleted) {
  createDeletedStmt.run(newDeleted.itemID, newDeleted.lastModified, newDeleted.itemTable);
}

// read

export function readNote(itemID: bigint) {
  const note = readNoteStmt.get(itemID) as Note;
  if (note === undefined) return undefined;

  const extensions = readExtensions(itemID);
  if (extensions !== undefined) note.extensions = extensions;

  castItemBigInts(note);
  return note;
}

export function readReminder(itemID: bigint) {
  const rem = readReminderStmt.get(itemID) as Reminder;
  if (rem === undefined) return undefined;

  const extensions = readExtensions(itemID);
  if (extensions !== undefined) rem.extensions = extensions;

  castItemBigInts(rem);
  return rem;
}

export function readDailyReminder(itemID: bigint) {
  const dailyRem = readDailyReminderStmt.get(itemID) as DailyReminder;
  if (dailyRem === undefined) return undefined;

  const extensions = readExtensions(itemID);
  if (extensions !== undefined) dailyRem.extensions = extensions;

  castItemBigInts(dailyRem);
  return dailyRem;
}

export function readWeeklyReminder(itemID: bigint) {
  const weeklyRem = readWeeklyReminderStmt.get(itemID) as WeeklyReminder;
  if (weeklyRem === undefined) return undefined;

  const extensions = readExtensions(itemID);
  if (extensions !== undefined) weeklyRem.extensions = extensions;

  castItemBigInts(weeklyRem);
  return weeklyRem;
}

export function readMonthlyReminder(itemID: bigint) {
  const monthlyRem = readMonthlyReminderStmt.get(itemID) as MonthlyReminder;
  if (monthlyRem === undefined) return undefined;

  const extensions = readExtensions(itemID);
  if (extensions !== undefined) monthlyRem.extensions = extensions;

  castItemBigInts(monthlyRem);
  return monthlyRem;
}

export function readYearlyReminder(itemID: bigint) {
  const yearlyRem = readYearlyReminderStmt.get(itemID) as YearlyReminder;
  if (yearlyRem === undefined) return undefined;

  const extensions = readExtensions(itemID);
  if (extensions !== undefined) yearlyRem.extensions = extensions;

  castItemBigInts(yearlyRem);
  return yearlyRem;
}

function readExtensions(itemID: bigint) {
  const extensions = readExtensionsStmt.all(itemID) as Extension[];
  if (extensions === undefined) return undefined;
  castExtensionsBigInts(extensions);
  return extensions;
}

export function readOverrides(linkedItemID: bigint) {
  const overrides = readOverridesStmt.all(linkedItemID) as Override[];
  if (overrides === undefined) return undefined;
  castOverridesBigInts(overrides);
  return overrides;
}

export function readFolder(folderID: bigint) {
  const folder = readFolderStmt.get(folderID) as Folder;
  if (folder === undefined) return undefined;
  castFolderBigInts(folder);
  return folder;
}

export function readGeneratedReminders(itemID: bigint) {
  const reminders = readGeneratedsStmt.all(itemID) as GeneratedReminder[];
  if (reminders === undefined) return undefined;
  castGeneratedRemindersBigInts(reminders);
  return reminders;
}

// read in range

export function readNotesInRange(windowStartMs: bigint, windowEndMs: bigint) {
  const notes = readNotesInRangeStmt.all({ windowStartMs: windowStartMs, windowEndMs: windowEndMs }) as Note[];
  if (notes === undefined) return undefined;

  for (const note of notes) {
    const extensions = readExtensions(note.itemID);
    if (extensions !== undefined) note.extensions = extensions;
  }

  castItemsBigInts(notes);
  return notes;
}

export function readRemindersInRange(rangeWindow: RangeWindow) {
  const rems = readRemindersInRangeStmt.all({windowStartYear: rangeWindow.startYear,
    windowStartMinOfYear: rangeWindow.startMinOfYear,
    windowEndYear: rangeWindow.endYear,
    windowEndMinOfYear: rangeWindow.endMinOfYear
  }) as Reminder[];
  if (rems === undefined) return undefined;

  for (const rem of rems) {
    const extensions = readExtensions(rem.itemID);
    if (extensions !== undefined) rem.extensions = extensions;
  }

  castItemsBigInts(rems);
  return rems;
}

export function readDailyRemindersInRange(rangeWindow: RangeWindow) {
  const dailyRems = readDailyRemindersInRangeStmt.all({
    windowStartYear: rangeWindow.startYear,
    windowStartMinOfYear: rangeWindow.startMinOfYear,
    windowEndYear: rangeWindow.endYear,
    windowEndMinOfYear: rangeWindow.endMinOfYear
  }) as DailyReminder[];
  if (dailyRems === undefined) return undefined;

  for (const dailyRem of dailyRems) {
    const extensions = readExtensions(dailyRem.itemID);
    if (extensions !== undefined) dailyRem.extensions = extensions;
  }

  castItemsBigInts(dailyRems);
  return dailyRems;
}

export function readWeeklyRemindersInRange(rangeWindow: RangeWindow) {
  const weeklyRems = readWeeklyRemindersInRangeStmt.all({
    windowStartYear: rangeWindow.startYear,
    windowStartMinOfYear: rangeWindow.startMinOfYear,
    windowEndYear: rangeWindow.endYear,
    windowEndMinOfYear: rangeWindow.endMinOfYear
  }) as WeeklyReminder[];
  if (weeklyRems === undefined) return undefined;

  for (const weeklyRem of weeklyRems) {
    const extensions = readExtensions(weeklyRem.itemID);
    if (extensions !== undefined) weeklyRem.extensions = extensions;
  }

  castItemsBigInts(weeklyRems);
  return weeklyRems;
}

export function readMonthlyRemindersInRange(rangeWindow: RangeWindow) {
  const monthlyRems = readMonthlyRemindersInRangeStmt.all({
    windowStartYear: rangeWindow.startYear,
    windowStartMinOfYear: rangeWindow.startMinOfYear,
    windowEndYear: rangeWindow.endYear,
    windowEndMinOfYear: rangeWindow.endMinOfYear
  }) as MonthlyReminder[];
  if (monthlyRems === undefined) return undefined;

  for (const monthlyRem of monthlyRems) {
    const extensions = readExtensions(monthlyRem.itemID);
    if (extensions !== undefined) monthlyRem.extensions = extensions;
  }

  castItemsBigInts(monthlyRems);
  return monthlyRems;
}

export function readYearlyRemindersInRange(rangeWindow: RangeWindow) {
  const yearlyRems = readYearlyRemindersInRangeStmt.all({
    windowStartYear: rangeWindow.startYear,
    windowStartMinOfYear: rangeWindow.startMinOfYear,
    windowEndYear: rangeWindow.endYear,
    windowEndMinOfYear: rangeWindow.endMinOfYear
  }) as YearlyReminder[];
  if (yearlyRems === undefined) return undefined;

  for (const yearlyRem of yearlyRems) {
    const extensions = readExtensions(yearlyRem.itemID);
    if (extensions !== undefined) yearlyRem.extensions = extensions;
  }

  castItemsBigInts(yearlyRems);
  return yearlyRems;
}

export function readGeneratedRemindersInRange(rangeWindow: RangeWindow) {
  const generatedYears = gen.getGeneratedYears();
  const newGeneratedRems: GeneratedReminder[] = [];
  for (let i = rangeWindow.startYear - 1; i <= rangeWindow.endYear + 1; i++) { // -1 and +1 ensure all generated reminders within the window are included in case of long event times
    if (!generatedYears.has(i)) newGeneratedRems.push(...gen.generateAllInYear(i));
  }
  createOrUpdateGeneratedReminders(newGeneratedRems); // create generated rems required to read within the given range accurately

  const generatedRems = readGeneratedRemindersInRangeStmt.all({
    windowStartYear: rangeWindow.startYear,
    windowStartMinOfYear: rangeWindow.startMinOfYear,
    windowEndYear: rangeWindow.endYear,
    windowEndMinOfYear: rangeWindow.endMinOfYear
  }) as GeneratedReminder[];
  if (generatedRems === undefined) return undefined;

  for (const generatedRem of generatedRems) {
    const extensions = readExtensions(generatedRem.itemID);
    if (extensions !== undefined) generatedRem.extensions = extensions;
  }

  castGeneratedRemindersBigInts(generatedRems);
  return generatedRems;
}

// read all

export function readAllFolders() {
  const folders = readAllFoldersStmt.all() as Folder[];
  if (folders === undefined) return undefined;
  castFoldersBigInts(folders);
  return folders;
}

// get IDs based on folderID

export function readNotesInFolder(folderID: bigint) {
  const itemIDs = readNotesInFolderStmt.all(folderID) as { itemID: bigint }[];
  return itemIDs.map(itemID => BigInt(itemID.itemID));
}

export function readRemindersInFolder(folderID: bigint) {
  const itemIDs = readRemindersInFolderStmt.all(folderID) as { itemID: bigint }[];
  return itemIDs.map((itemID) => BigInt(itemID.itemID));
}

export function readDailyRemindersInFolder(folderID: bigint) {
  const itemIDs = readDailyRemindersInFolderStmt.all(folderID) as { itemID: bigint }[];
  return itemIDs.map((itemID) => BigInt(itemID.itemID));
}

export function readWeeklyRemindersInFolder(folderID: bigint) {
  const itemIDs = readWeeklyRemindersInFolderStmt.all(folderID) as { itemID: bigint }[];
  return itemIDs.map((itemID) => BigInt(itemID.itemID));
}

export function readMonthlyRemindersInFolder(folderID: bigint) {
  const itemIDs = readMonthlyRemindersInFolderStmt.all(folderID) as { itemID: bigint }[];
  return itemIDs.map((itemID) => BigInt(itemID.itemID));
}

export function readYearlyRemindersInFolder(folderID: bigint) {
  const itemIDs = readYearlyRemindersInFolderStmt.all(folderID) as { itemID: bigint }[];
  return itemIDs.map((itemID) => BigInt(itemID.itemID));
}

export function readFoldersInFolder(parentFolderID: bigint) {
  const folderIDs = readFoldersInFolderStmt.all(parentFolderID) as { folderID: bigint }[];
  return folderIDs.map((folderID) => BigInt(folderID.folderID));
}

// read all modified after a given timestamp (for use in sync-up)

export function readNotesAfter(lastUpdated: bigint) {
  const notes = readNotesAfterStmt.all(lastUpdated) as Note[];
  if (notes === undefined) return undefined;
  castItemsBigInts(notes);
  return notes;
}

export function readRemindersAfter(lastUpdated: bigint) {
  const rems = readRemindersAfterStmt.all(lastUpdated) as Reminder[];
  if (rems === undefined) return undefined;
  castItemsBigInts(rems);
  return rems;
}

export function readDailyRemindersAfter(lastUpdated: bigint) {
  const dailyRems = readDailyRemindersAfterStmt.all(lastUpdated) as DailyReminder[];
  if (dailyRems === undefined) return undefined;
  castItemsBigInts(dailyRems);
  return dailyRems;
}

export function readWeeklyRemindersAfter(lastUpdated: bigint) {
  const weeklyRems = readWeeklyRemindersAfterStmt.all(lastUpdated) as WeeklyReminder[];
  if (weeklyRems === undefined) return undefined;
  castItemsBigInts(weeklyRems);
  return weeklyRems;
}

export function readMonthlyRemindersAfter(lastUpdated: bigint) {
  const monthlyRems = readMonthlyRemindersAfterStmt.all(lastUpdated) as MonthlyReminder[];
  if (monthlyRems === undefined) return undefined;
  castItemsBigInts(monthlyRems);
  return monthlyRems;
}

export function readYearlyRemindersAfter(lastUpdated: bigint) {
  const yearlyRems = readYearlyRemindersAfterStmt.all(lastUpdated) as YearlyReminder[];
  if (yearlyRems === undefined) return undefined;
  castItemsBigInts(yearlyRems);
  return yearlyRems;
}

export function readExtensionsAfter(lastUpdated: bigint) {
  const extensions = readExtensionsAfterStmt.all(lastUpdated) as Extension[];
  if (extensions === undefined) return undefined;
  castExtensionsBigInts(extensions);
  return extensions;
}

export function readOverridesAfter(lastUpdated: bigint) {
  const overrides = readOverridesAfterStmt.all(lastUpdated) as Override[];
  if (overrides === undefined) return undefined;
  castOverridesBigInts(overrides);
  return overrides;
}

export function readFoldersAfter(lastUpdated: bigint) {
  const folders = readFoldersAfterStmt.all(lastUpdated) as Folder[];
  if (folders === undefined) return undefined;
  castFoldersBigInts(folders);
  return folders;
}

export function readDeletesAfter(lastUpdated: bigint) {
  const deletes = readDeletesAfterStmt.all(lastUpdated) as Deleted[];
  if (deletes === undefined) return undefined;
  castDeletesBigInts(deletes);
  return deletes;
}

// read lastModified based on itemID (used in storing items retrieved in sync-down)

export function readNoteLm(itemID: bigint) {
  const lastModified = readNoteLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readReminderLm(itemID: bigint) {
  const lastModified = readReminderLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readDailyReminderLm(itemID: bigint) {
  const lastModified = readDailyReminderLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readWeeklyReminderLm(itemID: bigint) {
  const lastModified = readWeeklyReminderLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readMonthlyReminderLm(itemID: bigint) {
  const lastModified = readMonthlyReminderLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readYearlyReminderLm(itemID: bigint) {
  const lastModified = readYearlyReminderLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readExtensionLm(itemID: bigint, sequenceNum: number) {
  const lastModified = readExtensionLmStmt.get(itemID, sequenceNum) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readOverrideLm(itemID: bigint) {
  const lastModified = readOverrideLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readFolderLm(folderID: bigint) {
  const lastModified = readFolderLmStmt.get(folderID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readDeletedLm(itemID: bigint) {
  const lastModified = readDeletedLmStmt.get(itemID) as { lastModified: bigint };
  if (lastModified === undefined) return undefined;
  return BigInt(lastModified.lastModified);
}

export function readGeneratedReminderIDInYear(eventStartYear: number) { // checks for eventStartYear to determine if a year has been generated (used in init)
  const itemID = readGeneratedReminderIDInYearStmt.get(eventStartYear) as { itemID: bigint };
  if (itemID === undefined) return undefined;
  return BigInt(itemID.itemID);
}

export function readOverrideID(linkedItemID: bigint, origEventStartYear: number, origEventStartDay: number, origEventStartMin: number) {
  const itemID = readOverrideIDStmt.get(linkedItemID, origEventStartYear, origEventStartDay, origEventStartMin) as { itemID: bigint };
  if (itemID === undefined) return undefined;
  return BigInt(itemID.itemID);
}

// update

export function updateNote(modNote: Note) {
  updateNoteStmt.run(modNote.lastModified, modNote.folderID, modNote.isExtended, modNote.title, modNote.text, modNote.itemID); // itemID last
  if (modNote.extensions !== undefined) for (const ext of modNote.extensions) createExtension(ext);
}

export function updateReminder(modRem: Reminder) {
  updateReminderStmt.run(
    modRem.lastModified, modRem.folderID, modRem.eventType, modRem.eventStartYear, modRem.eventStartDay,
    modRem.eventStartMin, modRem.eventEndYear, modRem.eventEndDay, modRem.eventEndMin, modRem.notifYear,
    modRem.notifDay, modRem.notifMin, modRem.isExtended, modRem.hasNotif, modRem.title, modRem.itemID
  ); // itemID last
  if (modRem.extensions !== undefined) for (const ext of modRem.extensions) createExtension(ext);
}

export function updateDailyReminder(modDailyRem: DailyReminder) {
  updateDailyReminderStmt.run(
    modDailyRem.lastModified, modDailyRem.folderID, modDailyRem.eventType, modDailyRem.seriesStartYear,
    modDailyRem.seriesStartDay, modDailyRem.seriesStartMin, modDailyRem.seriesEndYear, modDailyRem.seriesEndDay,
    modDailyRem.seriesEndMin, modDailyRem.timeOfDayMin, modDailyRem.eventDurationMin, modDailyRem.notifOffsetTimeMin,
    modDailyRem.hasNotifs, modDailyRem.isExtended, modDailyRem.everyNDays, modDailyRem.title, modDailyRem.itemID
  ); // itemID last
  if (modDailyRem.extensions !== undefined) for (const ext of modDailyRem.extensions) createExtension(ext);

  // delete overrides when recurring reminder is modified and create new generated reminders
  deleteGeneratedRemindersById(modDailyRem.itemID);
  deleteOverridesByLinkedId(modDailyRem.itemID);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // regenerate for all generatedYears
    generatedRems.push(...gen.generateDaily(modDailyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function updateWeeklyReminder(modWeeklyRem: WeeklyReminder) {
  updateWeeklyReminderStmt.run(
    modWeeklyRem.lastModified, modWeeklyRem.folderID, modWeeklyRem.eventType, modWeeklyRem.seriesStartYear,
    modWeeklyRem.seriesStartDay, modWeeklyRem.seriesStartMin, modWeeklyRem.seriesEndYear, modWeeklyRem.seriesEndDay,
    modWeeklyRem.seriesEndMin, modWeeklyRem.timeOfDayMin, modWeeklyRem.eventDurationMin, modWeeklyRem.notifOffsetTimeMin,
    modWeeklyRem.hasNotifs, modWeeklyRem.isExtended, modWeeklyRem.everyNWeeks, modWeeklyRem.daysOfWeek, modWeeklyRem.title,
    modWeeklyRem.itemID
  ); // itemID last
  if (modWeeklyRem.extensions !== undefined) for (const ext of modWeeklyRem.extensions) createExtension(ext);

  // delete overrides when recurring reminder is modified and create new generated reminders
  deleteGeneratedRemindersById(modWeeklyRem.itemID);
  deleteOverridesByLinkedId(modWeeklyRem.itemID);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // regenerate for all generatedYears
    generatedRems.push(...gen.generateWeekly(modWeeklyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function updateMonthlyReminder(modMonthlyRem: MonthlyReminder) {
  updateMonthlyReminderStmt.run(
    modMonthlyRem.lastModified, modMonthlyRem.folderID, modMonthlyRem.eventType, modMonthlyRem.seriesStartYear,
    modMonthlyRem.seriesStartDay, modMonthlyRem.seriesStartMin, modMonthlyRem.seriesEndYear, modMonthlyRem.seriesEndDay,
    modMonthlyRem.seriesEndMin, modMonthlyRem.timeOfDayMin, modMonthlyRem.eventDurationMin, modMonthlyRem.notifOffsetTimeMin,
    modMonthlyRem.hasNotifs, modMonthlyRem.isExtended, modMonthlyRem.lastDayOfMonth, modMonthlyRem.daysOfMonth, modMonthlyRem.title,
    modMonthlyRem.itemID
  ); // itemID last
  if (modMonthlyRem.extensions !== undefined) for (const ext of modMonthlyRem.extensions) createExtension(ext);

  // delete overrides when recurring reminder is modified and create new generated reminders
  deleteGeneratedRemindersById(modMonthlyRem.itemID);
  deleteOverridesByLinkedId(modMonthlyRem.itemID);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // regenerate for all generatedYears
    generatedRems.push(...gen.generateMonthly(modMonthlyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function updateYearlyReminder(modYearlyRem: YearlyReminder) {
  updateYearlyReminderStmt.run(
    modYearlyRem.lastModified, modYearlyRem.folderID, modYearlyRem.eventType, modYearlyRem.seriesStartYear,
    modYearlyRem.seriesStartDay, modYearlyRem.seriesStartMin, modYearlyRem.seriesEndYear, modYearlyRem.seriesEndDay,
    modYearlyRem.seriesEndMin, modYearlyRem.timeOfDayMin, modYearlyRem.eventDurationMin, modYearlyRem.notifOffsetTimeMin,
    modYearlyRem.hasNotifs, modYearlyRem.isExtended, modYearlyRem.dayOfYear, modYearlyRem.title, modYearlyRem.itemID
  ); // itemID last
  if (modYearlyRem.extensions !== undefined) for (const ext of modYearlyRem.extensions) createExtension(ext);

  // delete overrides when recurring reminder is modified and create new generated reminders
  deleteGeneratedRemindersById(modYearlyRem.itemID);
  deleteOverridesByLinkedId(modYearlyRem.itemID);

  const generatedYears = gen.getGeneratedYears();
  const generatedRems: GeneratedReminder[] = [];
  for (const year of generatedYears) { // regenerate for all generatedYears
    generatedRems.push(...gen.generateYearly(modYearlyRem, year));
  }
  createOrUpdateGeneratedReminders(generatedRems);
}

export function updateFolder(modFolder: Folder) {
  updateFolderStmt.run(modFolder.lastModified, modFolder.parentFolderID, modFolder.colorCode, modFolder.folderName, modFolder.folderID); // folderID last
}

// delete

export function deleteNote(itemID: bigint) {
  return (deleteNoteStmt.run(itemID).changes != 0);
}

export function deleteReminder(itemID: bigint) {
  return (deleteReminderStmt.run(itemID).changes != 0);
}

export function deleteDailyReminder(itemID: bigint) {
  return (deleteDailyReminderStmt.run(itemID).changes != 0);
}

export function deleteWeeklyReminder(itemID: bigint) {
  return (deleteWeeklyReminderStmt.run(itemID).changes != 0);
}

export function deleteMonthlyReminder(itemID: bigint) {
  return (deleteMonthlyReminderStmt.run(itemID).changes != 0);
}

export function deleteYearlyReminder(itemID: bigint) {
  return (deleteYearlyReminderStmt.run(itemID).changes != 0);
}

export function deleteExtension(itemID: bigint, sequenceNum: number) {
  deleteExtensionStmt.run(itemID, sequenceNum);
}

export function deleteAllExtensions(itemID: bigint) {
  deleteAllExtensionsStmt.run(itemID);
}

export function deleteFolder(folderID: bigint) {
  return (deleteFolderStmt.run(folderID).changes != 0);
}

export function deleteGeneratedRemindersOutsideYearRange(startYear: number, endYear: number) {
  deleteGeneratedRemindersOutsideYearRangeStmt.run(startYear, endYear);
}

export function deleteGeneratedRemindersById(itemID: bigint) {
  deleteGeneratedRemindersByIdStmt.run(itemID);
}

export function deleteOverridesByLinkedId(linkedItemID: bigint) {
  deleteOverridesByLinkedIdStmt.run(linkedItemID);
}


export function clearAllTables() {
  dropTables();
  createTables();
}

// helpers

function createTables() {
  db.exec(sql.createNotesTable);
  db.exec(sql.createRemindersTable);
  db.exec(sql.createDailyTable);
  db.exec(sql.createWeeklyTable);
  db.exec(sql.createMonthlyTable);
  db.exec(sql.createYearlyTable);
  db.exec(sql.createGeneratedTable);
  db.exec(sql.createExtensionsTable);
  db.exec(sql.createOverridesTable);
  db.exec(sql.createFoldersTable);
  db.exec(sql.createDeletedTable);
}

function dropTables() {
  db.exec(sql.dropNotesTable);
  db.exec(sql.dropRemindersTable);
  db.exec(sql.dropDailyTable);
  db.exec(sql.dropWeeklyTable);
  db.exec(sql.dropMonthlyTable);
  db.exec(sql.dropYearlyTable);
  db.exec(sql.dropGeneratedTable);
  db.exec(sql.dropExtensionsTable);
  db.exec(sql.dropOverridesTable);
  db.exec(sql.dropFoldersTable);
  db.exec(sql.dropDeletedTable);
}

function castItemBigInts(item: Note | Reminder | DailyReminder | WeeklyReminder | MonthlyReminder | YearlyReminder) {
  item.itemID = BigInt(item.itemID);
  item.lastModified = BigInt(item.lastModified);
  item.folderID = BigInt(item.folderID);
}

function castItemsBigInts(items: Note[] | Reminder[] | DailyReminder[] | WeeklyReminder[] | MonthlyReminder[] | YearlyReminder[]) {
  for (const item of items) castItemBigInts(item);
}

function castExtensionBigInts(extension: Extension) {
  extension.itemID = BigInt(extension.itemID);
  extension.lastModified = BigInt(extension.lastModified);
}

function castExtensionsBigInts(extensions: Extension[]) {
  for (const extension of extensions) castExtensionBigInts(extension);
}

function castGeneratedReminderBigInts(generatedRem: GeneratedReminder) {
  generatedRem.itemID = BigInt(generatedRem.itemID);
  generatedRem.folderID = BigInt(generatedRem.folderID);
}

function castGeneratedRemindersBigInts(generatedRems: GeneratedReminder[]) {
  for (const generatedRem of generatedRems) castGeneratedReminderBigInts(generatedRem);
}

function castOverrideBigInts(override: Override) {
  override.itemID = BigInt(override.itemID);
  override.linkedItemID = BigInt(override.linkedItemID);
  override.lastModified = BigInt(override.lastModified);
}

function castOverridesBigInts(overrides: Override[]) {
  for (const override of overrides) castOverrideBigInts(override);
}

function castFolderBigInts(folder: Folder) {
  folder.folderID = BigInt(folder.folderID);
  folder.lastModified = BigInt(folder.lastModified);
  folder.parentFolderID = BigInt(folder.parentFolderID);
}

function castFoldersBigInts(folders: Folder[]) {
  for (const folder of folders) castFolderBigInts(folder);
}

function castDeleteBigInts(deleted: Deleted) {
  deleted.itemID = BigInt(deleted.itemID);
  deleted.lastModified = BigInt(deleted.lastModified);
}

function castDeletesBigInts(deletes: Deleted[]) {
  for (const deleted of deletes) castDeleteBigInts(deleted);
}


// Example db
// test.db located in ..\AppData\Roaming\Electron
const exDBPath = path.join(app.getPath('userData'), 'test.db');
const exDB = new Database(exDBPath);

// Create example table if not exists
exDB.exec(sql.createExTable);

// prepare all sql queries once
const createExEntry = exDB.prepare(sql.createExEntry);
const readExEntry = exDB.prepare(sql.readExEntry);
const updateExEntry = exDB.prepare(sql.updateExEntry);
const deleteExEntry = exDB.prepare(sql.deleteExEntry);

// Create entry in example table
export function create(key: string, value: string) {
  createExEntry.run(key, value);
}

// Read entry from example table
export function read(key: string) {
  const row = readExEntry.get(key) as { value: string } | undefined;

  if (!row) return 'Not found';
  return row.value;
}

// Update entry in example table
export function update(key: string, value: string) {
  updateExEntry.run(value, key);
}

// Delete entry from example table
export function deleteEntry(key: string) {
  deleteExEntry.run(key);
}
