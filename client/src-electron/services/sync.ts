/*
 * Authors: Kevin Sirantoine
 * Created: 2025-10-30
 * Updated: 2025-11-13
 *
 * This file contains a function that manages the full sync operation including syncdown, syncup, lastUpdated, and
 * insertion of retrieved items into the local database.
 *
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import * as db from "../db/sqlite-db";
import { syncdown } from "app/src-electron/services/syncdown";
import { syncUp } from "app/src-electron/services/syncup";
import { getDateNowBuffer } from "../utils/sync-utils";
import { lastUpdated } from "app/src-electron/services/store";
import type { RetrievedItems } from "app/src-electron/services/syncdown";
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
  Deleted
} from "app/src-electron/types/shared-types";

export async function sync() {
  const retrievedItems = await syncdown();
  await syncUp();

  const dateNowBuffer = getDateNowBuffer();
  lastUpdated.set('lastUpNotes', dateNowBuffer);
  lastUpdated.set('lastUpReminders', dateNowBuffer);
  lastUpdated.set('lastUpDaily', dateNowBuffer);
  lastUpdated.set('lastUpWeekly', dateNowBuffer);
  lastUpdated.set('lastUpMonthly', dateNowBuffer);
  lastUpdated.set('lastUpYearly', dateNowBuffer);
  lastUpdated.set('lastUpExtensions', dateNowBuffer);
  lastUpdated.set('lastUpOverrides', dateNowBuffer);
  lastUpdated.set('lastUpFolders', dateNowBuffer);
  lastUpdated.set('lastUpDeleted', dateNowBuffer);

  if (retrievedItems !== undefined) insertRetrievedItems(retrievedItems);
}

function insertRetrievedItems(retrievedItems: RetrievedItems) {
  if (retrievedItems.folders !== undefined) {
    for (const folder of retrievedItems.folders) {
      insertRetrievedFolder(folder);
    }
  }
  if (retrievedItems.notes !== undefined) {
    for (const note of retrievedItems.notes) {
      insertRetrievedNote(note);
    }
  }
  if (retrievedItems.reminders !== undefined) {
    for (const rem of retrievedItems.reminders) {
      insertRetrievedReminder(rem);
    }
  }
  if (retrievedItems.dailyReminders !== undefined) {
    for (const daily of retrievedItems.dailyReminders) {
      insertRetrievedDaily(daily);
    }
  }
  if (retrievedItems.weeklyReminders !== undefined) {
    for (const weekly of retrievedItems.weeklyReminders) {
      insertRetrievedWeekly(weekly);
    }
  }
  if (retrievedItems.monthlyReminders !== undefined) {
    for (const monthly of retrievedItems.monthlyReminders) {
      insertRetrievedMonthly(monthly);
    }
  }
  if (retrievedItems.yearlyReminders !== undefined) {
    for (const yearly of retrievedItems.yearlyReminders) {
      insertRetrievedYearly(yearly);
    }
  }
  if (retrievedItems.extensions !== undefined) {
    for (const extension of retrievedItems.extensions) {
      insertRetrievedExtension(extension);
    }
  }
  if (retrievedItems.overrides !== undefined) {
    for (const override of retrievedItems.overrides) {
      insertRetrievedOverride(override);
    }
  }
  const folderDeletes: Deleted[] = [];
  if (retrievedItems.deletes !== undefined) {
    for (const deleted of retrievedItems.deletes) {
      const folderDelete = insertRetrievedDeleted(deleted);
      if (folderDelete !== undefined) folderDeletes.push(folderDelete);
    }
    for (const folderDelete of folderDeletes) {
      attemptDeleteFolder(folderDelete.itemID);
    }
  }
}

function insertRetrievedNote(retrievedNote: Note) {
  const localLm = db.readNoteLm(retrievedNote.itemID);
  if (localLm === undefined) db.createNote(retrievedNote);
  else if (localLm < retrievedNote.lastModified) db.updateNote(retrievedNote);
  // keep local copy if localLm >= retrievedNote.lastModified
}

function insertRetrievedReminder(retrievedRem: Reminder) {
  const localLm = db.readReminderLm(retrievedRem.itemID);
  if (localLm === undefined) db.createReminder(retrievedRem);
  else if (localLm < retrievedRem.lastModified) db.updateReminder(retrievedRem);
}

function insertRetrievedDaily(retrievedDaily: DailyReminder) {
  const localLm = db.readDailyReminderLm(retrievedDaily.itemID);
  if (localLm === undefined) db.createDailyReminder(retrievedDaily);
  else if (localLm < retrievedDaily.lastModified) db.updateDailyReminder(retrievedDaily);
}

function insertRetrievedWeekly(retrievedWeekly: WeeklyReminder) {
  const localLm = db.readWeeklyReminderLm(retrievedWeekly.itemID);
  if (localLm === undefined) db.createWeeklyReminder(retrievedWeekly);
  else if (localLm < retrievedWeekly.lastModified) db.updateWeeklyReminder(retrievedWeekly);
}

function insertRetrievedMonthly(retrievedMonthly: MonthlyReminder) {
  const localLm = db.readMonthlyReminderLm(retrievedMonthly.itemID);
  if (localLm === undefined) db.createMonthlyReminder(retrievedMonthly);
  else if (localLm < retrievedMonthly.lastModified) db.updateMonthlyReminder(retrievedMonthly);
}

function insertRetrievedYearly(retrievedYearly: YearlyReminder) {
  const localLm = db.readYearlyReminderLm(retrievedYearly.itemID);
  if (localLm === undefined) db.createYearlyReminder(retrievedYearly);
  else if (localLm < retrievedYearly.lastModified) db.updateYearlyReminder(retrievedYearly);
}

function insertRetrievedExtension(retrievedExtension: Extension) {
  const localLm = db.readExtensionLm(retrievedExtension.itemID, retrievedExtension.sequenceNum);
  if (localLm === undefined) db.createExtension(retrievedExtension);
  else if (localLm < retrievedExtension.lastModified) {
    db.deleteExtension(retrievedExtension.itemID, retrievedExtension.sequenceNum);
    db.createExtension(retrievedExtension);
  }
}

function insertRetrievedOverride(retrievedOverride: Override) {
  const localLm = db.readOverrideLm(retrievedOverride.itemID);
  if (localLm === undefined) db.createOrUpdateOverride(retrievedOverride);
  else if (localLm < retrievedOverride.lastModified) db.createOrUpdateOverride(retrievedOverride);
}

function insertRetrievedFolder(retrievedFolder: Folder) {
  const localLm = db.readFolderLm(retrievedFolder.folderID);
  if (localLm === undefined) db.createFolder(retrievedFolder);
  else if (localLm < retrievedFolder.lastModified) db.updateFolder(retrievedFolder);
}

const notesTable = 11;
const remindersTable = 12;
const dailyTable = 21;
const weeklyTable = 22;
const monthlyTable = 23;
const yearlyTable = 24;
const foldersTable = 32;

function insertRetrievedDeleted(deleted: Deleted) {
  const localLm = db.readDeletedLm(deleted.itemID);
  if (deleted.itemTable === foldersTable) return deleted; // keep a list of folders then delete the folders after all else
  else if (localLm === undefined) {
    attemptDeleteItem(deleted.itemID, deleted.itemTable)
    db.createDeleted(deleted);
  }
}


// helpers
function attemptDeleteItem(itemID: bigint, itemTable: number) {
  let deleteOccurred = false;
  switch (itemTable) {
    case notesTable: {
      deleteOccurred = db.deleteNote(itemID); // itemID MUST be present
      break;
    }
    case remindersTable: {
      deleteOccurred = db.deleteReminder(itemID);
      break;
    }
    case dailyTable: {
      deleteOccurred = db.deleteDailyReminder(itemID);
      break;
    }
    case weeklyTable: {
      deleteOccurred = db.deleteWeeklyReminder(itemID);
      break;
    }
    case monthlyTable: {
      deleteOccurred = db.deleteMonthlyReminder(itemID);
      break;
    }
    case yearlyTable: {
      deleteOccurred = db.deleteYearlyReminder(itemID);
      break;
    }
    default:
      break;
  }

  if (deleteOccurred) {
    db.deleteAllExtensions(itemID); // delete all extensions associated with deleted item

    if (Math.floor(itemTable / 10) === 2) { // itemTable = 2_ (recurring reminder)
      db.deleteGeneratedRemindersById(itemID);
      db.deleteOverridesByLinkedId(itemID);
    }
  }
}

function attemptDeleteFolder(folderID: bigint) {
  if (folderID === 0n) return // root folder cannot be deleted

  let itemIDs = db.readNotesInFolder(folderID);
  for (const itemID of itemIDs) {
    attemptDeleteItem(itemID, notesTable)
    db.createDeleted({itemID: itemID, lastModified: BigInt(Date.now()),itemTable: notesTable});
  }
  itemIDs = db.readRemindersInFolder(folderID);
  for (const itemID of itemIDs) {
    attemptDeleteItem(itemID, remindersTable)
    db.createDeleted({itemID: itemID, lastModified: BigInt(Date.now()),itemTable: remindersTable});
  }
  itemIDs = db.readDailyRemindersInFolder(folderID);
  for (const itemID of itemIDs) {
    attemptDeleteItem(itemID, dailyTable)
    db.createDeleted({itemID: itemID, lastModified: BigInt(Date.now()),itemTable: dailyTable});
  }
  itemIDs = db.readWeeklyRemindersInFolder(folderID);
  for (const itemID of itemIDs) {
    attemptDeleteItem(itemID, weeklyTable)
    db.createDeleted({itemID: itemID, lastModified: BigInt(Date.now()),itemTable: weeklyTable});
  }
  itemIDs = db.readMonthlyRemindersInFolder(folderID);
  for (const itemID of itemIDs) {
    attemptDeleteItem(itemID, monthlyTable)
    db.createDeleted({itemID: itemID, lastModified: BigInt(Date.now()),itemTable: monthlyTable});
  }
  itemIDs = db.readYearlyRemindersInFolder(folderID);
  for (const itemID of itemIDs) {
    attemptDeleteItem(itemID, yearlyTable)
    db.createDeleted({itemID: itemID, lastModified: BigInt(Date.now()),itemTable: yearlyTable});
  }

  const subFolderIDs = db.readFoldersInFolder(folderID);
  for (const subFolderID of subFolderIDs) attemptDeleteFolder(subFolderID); // recursively delete subfolders

  // sets folder deleted entry to current time for lastModified
  if (db.deleteFolder(folderID)) db.createDeleted({itemID: folderID, lastModified: BigInt(Date.now()),itemTable: foldersTable}); // finally, delete the folder and create deleted entry
}
