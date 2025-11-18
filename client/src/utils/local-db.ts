/*
 * Authors: Kevin Sirantoine
 * Created: 2025-10-13
 * Updated: 2025-11-17
 *
 * This file contains functions that perform CRUD operations on the local SQLite database through the IPC to provide
 * database access to the renderer process.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import {
  type Timestamp,
  getDayOfYear,
  isLeapYear,
  makeDateTime,
  diffTimestamp
} from '@quasar/quasar-ui-qcalendar';
import type {
  Note,
  Extension,
  Folder,
  Reminder,
  DailyReminder,
  WeeklyReminder,
  MonthlyReminder,
  YearlyReminder,
  Override,
  Deleted,
  RangeWindow
} from "app/src-electron/types/shared-types";

// create
export async function createNote(folderID: bigint, title: string, text: string) {
  const timeMs: bigint = BigInt(Date.now());
  const extCount = Math.ceil(text.length/64) - 1;

  const newNote: Note = {
    itemID: timeMs,
    lastModified: timeMs,
    folderID: folderID,
    isExtended: (extCount === 0 || extCount === -1) ? 0 : 1, // If text is <= 64 chars, isExtended is false
    title: title,
    text: text.substring(0, 64)
  };

  const extensions: Extension[] = [];
  for (let i = 1; i <= extCount; i++) {
    const extension: Extension = {
      itemID: timeMs,
      sequenceNum: i,
      lastModified: timeMs,
      data: text.substring(64*i, 64*(i+1))
    };
    extensions.push(extension);
  }
  if(newNote.isExtended === 1) newNote.extensions = extensions;
  await window.sqliteAPI.createNote(newNote);
  return timeMs; // Return the timestamp ID of the note to use in frontend
}

export async function createReminder(
  folderID: bigint, eventType: number, eventStartTime: Timestamp, eventEndTime: Timestamp,
  notifTime: Timestamp, hasNotif: boolean, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());

  const newRem: Reminder = {
    itemID: timeMs,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    eventStartYear: eventStartTime.year,
    eventStartDay: getDayOfYear(eventStartTime),
    eventStartMin: (eventStartTime.hour * 60) + eventStartTime.minute,
    eventEndYear: eventEndTime.year,
    eventEndDay: getDayOfYear(eventEndTime),
    eventEndMin: (eventEndTime.hour * 60) + eventEndTime.minute,
    notifYear: notifTime.year,
    notifDay: getDayOfYear(notifTime),
    notifMin: (notifTime.hour * 60) + notifTime.minute,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    hasNotif: (hasNotif) ? 1 : 0,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = timeMs;
      ext.lastModified = timeMs;
    }
    newRem.extensions = extensions;
  }
  await window.sqliteAPI.createReminder(newRem);
  return timeMs; // Return the timestamp ID of the reminder to use in frontend
}

export async function createDailyReminder(
  folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, everyNDays: number, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());

  const newDailyRem: DailyReminder = {
    itemID: timeMs,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    everyNDays: everyNDays,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = timeMs;
      ext.lastModified = timeMs;
    }
    newDailyRem.extensions = extensions;
  }
  await window.sqliteAPI.createDailyReminder(newDailyRem);
  // Return timestamp ID of recurring reminder to use in frontend
  return timeMs; 
}

export async function createWeeklyReminder(
  folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, everyNWeeks: number, daysOfWeek: string, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());

  const newWeeklyRem: WeeklyReminder = {
    itemID: timeMs,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    everyNWeeks: everyNWeeks,
    daysOfWeek: daysOfWeek,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = timeMs;
      ext.lastModified = timeMs;
    }
    newWeeklyRem.extensions = extensions;
  }
  await window.sqliteAPI.createWeeklyReminder(newWeeklyRem);
  // Return timestamp ID of recurring reminder to use in frontend
  return timeMs; 
}

export async function createMonthlyReminder(
  folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, lastDayOfMonth: boolean, daysOfMonth: string, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());

  const newMonthlyRem: MonthlyReminder = {
    itemID: timeMs,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    lastDayOfMonth: (lastDayOfMonth) ? 1 : 0,
    daysOfMonth: daysOfMonth,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = timeMs;
      ext.lastModified = timeMs;
    }
    newMonthlyRem.extensions = extensions;
  }
  await window.sqliteAPI.createMonthlyReminder(newMonthlyRem);
  // Return timestamp ID of recurring reminder to use in frontend
  return timeMs; 
}

export async function createYearlyReminder(
  folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, recurDay: Timestamp, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());
  let dayOfYear = getDayOfYear(recurDay);
  if (isLeapYear(recurDay.year))
  {
    if (dayOfYear === 60) dayOfYear = 366; // set to 366 if dayOfYear is leap day
    else if (dayOfYear > 60) dayOfYear -= 1;
  }

  const newYearlyRem: YearlyReminder = {
    itemID: timeMs,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    dayOfYear: dayOfYear,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = timeMs;
      ext.lastModified = timeMs;
    }
    newYearlyRem.extensions = extensions;
  }
  await window.sqliteAPI.createYearlyReminder(newYearlyRem);
  // Return timestamp ID of recurring reminder to use in frontend
  return timeMs; 
}

export async function createOrUpdateOverride(
  linkedItemID: bigint, origEventStartTime: Timestamp, eventStartTime: Timestamp, eventEndTime: Timestamp,
  notifTime: Timestamp, hasNotif: boolean) {
  const timeMs: bigint = BigInt(Date.now());

  const origEventStartYear = origEventStartTime.year;
  const origEventStartDay = getDayOfYear(origEventStartTime);
  const origEventStartMin = (origEventStartTime.hour * 60) + origEventStartTime.minute;
  let itemID = await window.sqliteAPI.readOverrideID(linkedItemID, origEventStartYear, origEventStartDay, origEventStartMin);
  if (itemID === undefined) itemID = timeMs;

  const override: Override = {
    itemID: itemID,
    linkedItemID: linkedItemID,
    lastModified: timeMs,
    origEventStartYear: origEventStartYear,
    origEventStartDay: origEventStartDay,
    origEventStartMin: origEventStartMin,
    eventStartYear: eventStartTime.year,
    eventStartDay: getDayOfYear(eventStartTime),
    eventStartMin: (eventStartTime.hour * 60) + eventStartTime.minute,
    eventEndYear: eventEndTime.year,
    eventEndDay: getDayOfYear(eventEndTime),
    eventEndMin: (eventEndTime.hour * 60) + eventEndTime.minute,
    notifYear: notifTime.year,
    notifDay: getDayOfYear(notifTime),
    notifMin: (notifTime.hour * 60) + notifTime.minute,
    hasNotif: (hasNotif) ? 1 : 0
  };
  await window.sqliteAPI.createOrUpdateOverride(override);
}

export async function createFolder(parentFolderID: bigint, colorCode: number, folderName: string) { // -1 treated as no colorCode
  const timeMs: bigint = BigInt(Date.now());
  const newFolder: Folder = {
    folderID: timeMs,
    lastModified: timeMs,
    parentFolderID: parentFolderID,
    colorCode: colorCode,
    folderName: folderName
  };
  await window.sqliteAPI.createFolder(newFolder);
  return timeMs; // Return the timestamp ID of the folder to use in frontend
}

export async function createRootFolder(colorCode: number) { // -1 treated as no colorCode
  const timeMs: bigint = BigInt(Date.now());
  const rootFolder: Folder = {
    folderID: 0n,
    lastModified: timeMs,
    parentFolderID: -1n,
    colorCode: colorCode,
    folderName: "root"
  };
  await window.sqliteAPI.createFolder(rootFolder);
}

export async function createDeleted(itemID: bigint, itemTable: number) {
  const timeMs: bigint = BigInt(Date.now());
  const newDeleted: Deleted = {
    itemID: itemID,
    lastModified: timeMs,
    itemTable: itemTable,
  };
  await window.sqliteAPI.createDeleted(newDeleted);
}


// read
export async function readNote(itemID: bigint) {
  const note = await window.sqliteAPI.readNote(itemID);

  const fullText = [note.text];
  if (note.extensions !== undefined) for (const ext of note.extensions) fullText.push(ext.data);
  note.text = fullText.join("");

  return note;
}

export async function readReminder(itemID: bigint) {
  return await window.sqliteAPI.readReminder(itemID);
}

export async function readDailyReminder(itemID: bigint) {
  return await window.sqliteAPI.readDailyReminder(itemID);
}

export async function readWeeklyReminder(itemID: bigint) {
  return await window.sqliteAPI.readWeeklyReminder(itemID);
}

export async function readMonthlyReminder(itemID: bigint) {
  return await window.sqliteAPI.readMonthlyReminder(itemID);
}

export async function readYearlyReminder(itemID: bigint) {
  return await window.sqliteAPI.readYearlyReminder(itemID);
}

export async function readFolder(folderID: bigint) {
  return await window.sqliteAPI.readFolder(folderID);
}

export async function readNotesInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) { // Range is in UTC
  const windowStartMs = BigInt(makeDateTime(windowStartTime).getTime());
  const windowEndMs = BigInt(makeDateTime(windowEndTime).getTime());
  if (windowStartMs > windowEndMs) return [];

  const notes = await window.sqliteAPI.readNotesInRange(windowStartMs, windowEndMs);

  for (const note of notes) {
    const fullText = [note.text];
    if (note.extensions !== undefined) for (const ext of note.extensions) fullText.push(ext.data);
    note.text = fullText.join("");
  }
  return notes;
}

export async function readRemindersInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) {
  if (diffTimestamp(windowStartTime, windowEndTime, false) < 0) return [];
  const rangeWindow = calculateRangeWindow(windowStartTime, windowEndTime);

  return await window.sqliteAPI.readRemindersInRange(rangeWindow);
}

export async function readDailyRemindersInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) {
  if (diffTimestamp(windowStartTime, windowEndTime, false) < 0) return [];
  const rangeWindow = calculateRangeWindow(windowStartTime, windowEndTime);

  return await window.sqliteAPI.readDailyRemindersInRange(rangeWindow);
}

export async function readWeeklyRemindersInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) {
  if (diffTimestamp(windowStartTime, windowEndTime, false) < 0) return [];
  const rangeWindow = calculateRangeWindow(windowStartTime, windowEndTime);

  return await window.sqliteAPI.readWeeklyRemindersInRange(rangeWindow);
}

export async function readMonthlyRemindersInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) {
  if (diffTimestamp(windowStartTime, windowEndTime, false) < 0) return [];
  const rangeWindow = calculateRangeWindow(windowStartTime, windowEndTime);

  return await window.sqliteAPI.readMonthlyRemindersInRange(rangeWindow);
}

export async function readYearlyRemindersInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) {
  if (diffTimestamp(windowStartTime, windowEndTime, false) < 0) return [];
  const rangeWindow = calculateRangeWindow(windowStartTime, windowEndTime);

  return await window.sqliteAPI.readYearlyRemindersInRange(rangeWindow);
}

export async function readGeneratedRemindersInRange(windowStartTime: Timestamp, windowEndTime: Timestamp) {
  if (diffTimestamp(windowStartTime, windowEndTime, false) < 0) return [];
  const rangeWindow = calculateRangeWindow(windowStartTime, windowEndTime);

  return await window.sqliteAPI.readGeneratedRemindersInRange(rangeWindow);
}

export async function readAllFolders() {
  return await window.sqliteAPI.readAllFolders();
}

// update
export async function updateNote(itemID: bigint, folderID: bigint, title: string, text: string) {
  const timeMs: bigint = BigInt(Date.now());
  const extCount = Math.ceil(text.length/64) - 1;
  await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with item as they are recreated during an update

  const modNote: Note = {
    itemID: itemID,
    lastModified: timeMs,
    folderID: folderID,
    isExtended: (extCount === 0 || extCount === -1) ? 0 : 1, // If text is <= 64 chars, isExtended is false
    title: title,
    text: text.substring(0, 64)
  };

  const extensions: Extension[] = [];
  for (let i = 1; i <= extCount; i++) {
    const extension: Extension = {
      itemID: itemID,
      sequenceNum: i,
      lastModified: timeMs,
      data: text.substring(64*i, 64*(i+1))
    };
    extensions.push(extension);
  }
  if(modNote.isExtended === 1) modNote.extensions = extensions;
  await window.sqliteAPI.updateNote(modNote);
}

export async function updateReminder(
  itemID: bigint, folderID: bigint, eventType: number, eventStartTime: Timestamp, eventEndTime: Timestamp,
  notifTime: Timestamp, hasNotif: boolean, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());
  await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with item as they are recreated during an update

  const modRem: Reminder = {
    itemID: itemID,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    eventStartYear: eventStartTime.year,
    eventStartDay: getDayOfYear(eventStartTime),
    eventStartMin: (eventStartTime.hour * 60) + eventStartTime.minute,
    eventEndYear: eventEndTime.year,
    eventEndDay: getDayOfYear(eventEndTime),
    eventEndMin: (eventEndTime.hour * 60) + eventEndTime.minute,
    notifYear: notifTime.year,
    notifDay: getDayOfYear(notifTime),
    notifMin: (notifTime.hour * 60) + notifTime.minute,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    hasNotif: (hasNotif) ? 1 : 0,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = itemID;
      ext.lastModified = timeMs;
    }
    modRem.extensions = extensions;
  }
  await window.sqliteAPI.updateReminder(modRem);
}

export async function updateDailyReminder(
  itemID: bigint, folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, everyNDays: number, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());
  await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with item as they are recreated during an update

  const modDailyRem: DailyReminder = {
    itemID: itemID,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    everyNDays: everyNDays,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = itemID;
      ext.lastModified = timeMs;
    }
    modDailyRem.extensions = extensions;
  }
  await window.sqliteAPI.updateDailyReminder(modDailyRem);
}

export async function updateWeeklyReminder(
  itemID: bigint, folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, everyNWeeks: number, daysOfWeek: string, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());
  await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with item as they are recreated during an update

  const modWeeklyRem: WeeklyReminder = {
    itemID: itemID,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    everyNWeeks: everyNWeeks,
    daysOfWeek: daysOfWeek,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = itemID;
      ext.lastModified = timeMs;
    }
    modWeeklyRem.extensions = extensions;
  }
  await window.sqliteAPI.updateWeeklyReminder(modWeeklyRem);
}

export async function updateMonthlyReminder(
  itemID: bigint, folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, lastDayOfMonth: boolean, daysOfMonth: string, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());
  await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with item as they are recreated during an update

  const modMonthlyRem: MonthlyReminder = {
    itemID: itemID,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    lastDayOfMonth: (lastDayOfMonth) ? 1 : 0,
    daysOfMonth: daysOfMonth,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = itemID;
      ext.lastModified = timeMs;
    }
    modMonthlyRem.extensions = extensions;
  }
  await window.sqliteAPI.updateMonthlyReminder(modMonthlyRem);
}

export async function updateYearlyReminder(
  itemID: bigint, folderID: bigint, eventType: number, seriesStartTime: Timestamp, seriesEndTime: Timestamp, timeOfDayMin: number, eventDurationMin: number,
  notifOffsetTimeMin: number, hasNotifs: boolean, recurTime: Timestamp, title: string, extensions?: Extension[]) {
  const timeMs: bigint = BigInt(Date.now());
  let dayOfYear = getDayOfYear(recurTime);
  if (isLeapYear(recurTime.year))
  {
    if (dayOfYear === 60) dayOfYear = 366; // set to 366 if dayOfYear is leap day
    else if (dayOfYear > 60) dayOfYear -= 1;
  }
  await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with item as they are recreated during an update

  const modYearlyRem: YearlyReminder = {
    itemID: itemID,
    lastModified: timeMs,
    folderID: folderID,
    eventType: eventType,
    seriesStartYear: seriesStartTime.year,
    seriesStartDay: getDayOfYear(seriesStartTime),
    seriesStartMin: (seriesStartTime.hour * 60) + seriesStartTime.minute,
    seriesEndYear: seriesEndTime.year,
    seriesEndDay: getDayOfYear(seriesEndTime),
    seriesEndMin: (seriesEndTime.hour * 60) + seriesEndTime.minute,
    timeOfDayMin: timeOfDayMin,
    eventDurationMin: eventDurationMin,
    notifOffsetTimeMin: notifOffsetTimeMin,
    hasNotifs: (hasNotifs) ? 1 : 0,
    isExtended: (eventType != 0) ? 1 : 0, // If reminder has eventType, isExtended is true
    dayOfYear: dayOfYear,
    title: title
  };

  if (extensions !== undefined) {
    for (const ext of extensions) {
      ext.itemID = itemID;
      ext.lastModified = timeMs;
    }
    modYearlyRem.extensions = extensions;
  }
  await window.sqliteAPI.updateYearlyReminder(modYearlyRem);
}

export async function updateFolder(folderID: bigint, parentFolderID: bigint, colorCode: number, folderName: string) { // -1 treated as no colorCode
  const timeMs: bigint = BigInt(Date.now());
  const modFolder: Folder = {
    folderID: folderID,
    lastModified: timeMs,
    parentFolderID: parentFolderID,
    colorCode: colorCode,
    folderName: folderName
  };
  await window.sqliteAPI.updateFolder(modFolder);
}


// delete
const notesTable = 11;
const remindersTable = 12;
const dailyTable = 21;
const weeklyTable = 22;
const monthlyTable = 23;
const yearlyTable = 24;
const foldersTable = 32;

export async function deleteItem(itemID: bigint, itemTable: number) { // used for all but specific extensions and folders
  let deleteOccurred = false;
  switch (itemTable) {
    case notesTable: {
      deleteOccurred = await window.sqliteAPI.deleteNote(itemID); // itemID MUST be present
      break;
    }
    case remindersTable: {
      deleteOccurred = await window.sqliteAPI.deleteReminder(itemID);
      break;
    }
    case dailyTable: {
      deleteOccurred = await window.sqliteAPI.deleteDailyReminder(itemID);
      break;
    }
    case weeklyTable: {
      deleteOccurred = await window.sqliteAPI.deleteWeeklyReminder(itemID);
      break;
    }
    case monthlyTable: {
      deleteOccurred = await window.sqliteAPI.deleteMonthlyReminder(itemID);
      break;
    }
    case yearlyTable: {
      deleteOccurred = await window.sqliteAPI.deleteYearlyReminder(itemID);
      break;
    }
    default:
      break;
  }

  if (deleteOccurred) {
    await window.sqliteAPI.deleteAllExtensions(itemID); // delete all extensions associated with deleted item
    await createDeleted(itemID, itemTable); // create deleted entry for the deleted item

    if (Math.floor(itemTable / 10) === 2) { // itemTable = 2_ (recurring reminder)
      await window.sqliteAPI.deleteGeneratedRemindersById(itemID);
      await window.sqliteAPI.deleteOverridesByLinkedId(itemID);
    }
  }
}

export async function deleteExtension(itemID: bigint, sequenceNum: number) {
  await window.sqliteAPI.deleteExtension(itemID, sequenceNum); // delete an individual extension
}

export async function deleteFolder(folderID: bigint) {
  if (folderID === 0n) return // root folder cannot be deleted

  let itemIDs = await window.sqliteAPI.readNotesInFolder(folderID);
  for (const itemID of itemIDs) await deleteItem(itemID, notesTable); // delete all items in the folder

  itemIDs = await window.sqliteAPI.readRemindersInFolder(folderID);
  for (const itemID of itemIDs) await deleteItem(itemID, remindersTable);

  itemIDs = await window.sqliteAPI.readDailyRemindersInFolder(folderID);
  for (const itemID of itemIDs) await deleteItem(itemID, dailyTable);

  itemIDs = await window.sqliteAPI.readWeeklyRemindersInFolder(folderID);
  for (const itemID of itemIDs) await deleteItem(itemID, weeklyTable);

  itemIDs = await window.sqliteAPI.readMonthlyRemindersInFolder(folderID);
  for (const itemID of itemIDs) await deleteItem(itemID, monthlyTable);

  itemIDs = await window.sqliteAPI.readYearlyRemindersInFolder(folderID);
  for (const itemID of itemIDs) await deleteItem(itemID, yearlyTable);

  const subFolderIDs = await window.sqliteAPI.readFoldersInFolder(folderID);
  for (const subFolderID of subFolderIDs) await deleteFolder(subFolderID); // recursively delete subfolders

  if (await window.sqliteAPI.deleteFolder(folderID)) await createDeleted(folderID, foldersTable); // finally, delete the folder and create deleted entry
}

export async function clearAllTables() {
  await window.sqliteAPI.clearAllTables(); // drop then recreate all tables
}

// helpers
function calculateRangeWindow(windowStartTime: Timestamp, windowEndTime: Timestamp) { // used for readInRange
  const startMinOfYear = getDayOfYear(windowStartTime) * 1440 + windowStartTime.hour * 60 + windowStartTime.minute;
  const endMinOfYear = getDayOfYear(windowEndTime) * 1440 + windowEndTime.hour * 60 + windowEndTime.minute;

  const rangeWindow: RangeWindow = {
    startYear: windowStartTime.year,
    startMinOfYear: startMinOfYear,
    endYear: windowEndTime.year,
    endMinOfYear: endMinOfYear
  };

  return rangeWindow
}
