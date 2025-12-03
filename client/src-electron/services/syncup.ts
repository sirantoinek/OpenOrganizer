/*
 * Authors: Kevin Sirantoine
 * Created: 2025-10-29
 * Updated: 2025-12-02
 *
 * This file defines functions for sending syncup requests.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import * as pack from "../utils/pack";
import * as db from "../db/sqlite-db";
import { getAuthToken, getUserId } from "app/src-electron/services/auth";
import { lastUpdated } from "app/src-electron/services/store";
import { sendRequest, logResponse } from "../utils/sync-utils";

export async function syncUp(serverAddr: string) {
  await upFolders(serverAddr);
  await upNotes(serverAddr);
  await upReminders(serverAddr);
  await upRemindersDaily(serverAddr);
  await upRemindersWeekly(serverAddr);
  await upRemindersMonthly(serverAddr);
  await upRemindersYearly(serverAddr);
  await upExtensions(serverAddr);
  await upOverrides(serverAddr);
  await upDeleted(serverAddr);
}

export async function upNotes(serverAddr: string) {
  const lastUpNotes = Buffer.from(lastUpdated.get('lastUpNotes')).readBigInt64LE(0);
  const notes = db.readNotesAfter(lastUpNotes);
  if (notes === undefined || notes.length === 0) return;

  const url = serverAddr + "syncup/notes";
  const body = Buffer.concat([getBodyHeader(notes.length), pack.packNotes(notes)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upReminders(serverAddr: string) {
  const lastUpReminders = Buffer.from(lastUpdated.get('lastUpReminders')).readBigInt64LE(0);
  const rems = db.readRemindersAfter(lastUpReminders);
  if (rems === undefined || rems.length === 0) return;

  const url = serverAddr + "syncup/reminders";
  const body = Buffer.concat([getBodyHeader(rems.length), pack.packReminders(rems)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upRemindersDaily(serverAddr: string) {
  const lastUpDaily = Buffer.from(lastUpdated.get('lastUpDaily')).readBigInt64LE(0);
  const dailyRems = db.readDailyRemindersAfter(lastUpDaily);
  if (dailyRems === undefined || dailyRems.length === 0) return;

  const url = serverAddr + "syncup/reminders/daily";
  const body = Buffer.concat([getBodyHeader(dailyRems.length), pack.packDailyReminders(dailyRems)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upRemindersWeekly(serverAddr: string) {
  const lastUpWeekly = Buffer.from(lastUpdated.get('lastUpWeekly')).readBigInt64LE(0);
  const weeklyRems = db.readWeeklyRemindersAfter(lastUpWeekly);
  if (weeklyRems === undefined || weeklyRems.length === 0) return;

  const url = serverAddr + "syncup/reminders/weekly";
  const body = Buffer.concat([getBodyHeader(weeklyRems.length), pack.packWeeklyReminders(weeklyRems)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upRemindersMonthly(serverAddr: string) {
  const lastUpMonthly = Buffer.from(lastUpdated.get('lastUpMonthly')).readBigInt64LE(0);
  const monthlyRems = db.readMonthlyRemindersAfter(lastUpMonthly);
  if (monthlyRems === undefined || monthlyRems.length === 0) return;

  const url = serverAddr + "syncup/reminders/monthly";
  const body = Buffer.concat([getBodyHeader(monthlyRems.length), pack.packMonthlyReminders(monthlyRems)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upRemindersYearly(serverAddr: string) {
  const lastUpYearly = Buffer.from(lastUpdated.get('lastUpYearly')).readBigInt64LE(0);
  const yearlyRems = db.readYearlyRemindersAfter(lastUpYearly);
  if (yearlyRems === undefined || yearlyRems.length === 0) return;

  const url = serverAddr + "syncup/reminders/yearly";
  const body = Buffer.concat([getBodyHeader(yearlyRems.length), pack.packYearlyReminders(yearlyRems)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upExtensions(serverAddr: string) {
  const lastUpExtensions = Buffer.from(lastUpdated.get('lastUpExtensions')).readBigInt64LE(0);
  const extensions = db.readExtensionsAfter(lastUpExtensions);
  if (extensions === undefined || extensions.length === 0) return;

  const url = serverAddr + "syncup/extensions";
  const body = Buffer.concat([getBodyHeader(extensions.length), pack.packExtensions(extensions)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upOverrides(serverAddr: string) {
  const lastUpOverrides = Buffer.from(lastUpdated.get('lastUpOverrides')).readBigInt64LE(0);
  const overrides = db.readOverridesAfter(lastUpOverrides);
  if (overrides === undefined || overrides.length === 0) return;

  const url = serverAddr + "syncup/overrides";
  const body = Buffer.concat([getBodyHeader(overrides.length), pack.packOverrides(overrides)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upFolders(serverAddr: string) {
  const lastUpFolders = Buffer.from(lastUpdated.get('lastUpFolders')).readBigInt64LE(0);
  const folders = db.readFoldersAfter(lastUpFolders);
  if (folders === undefined || folders.length === 0) return;

  const url = serverAddr + "syncup/folders";
  const body = Buffer.concat([getBodyHeader(folders.length), pack.packFolders(folders)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}

export async function upDeleted(serverAddr: string) {
  const lastUpDeleted = Buffer.from(lastUpdated.get('lastUpDeleted')).readBigInt64LE(0);
  const deletes = db.readDeletesAfter(lastUpDeleted);
  if (deletes === undefined || deletes.length === 0) return;

  const url = serverAddr + "syncup/deleted";
  const body = Buffer.concat([getBodyHeader(deletes.length), pack.packDeleted(deletes)]);

  const response = await sendRequest(url, body);
  if (response !== undefined) logResponse(url, response);
}


// helpers
function getBodyHeader(recordCount: number) {
  const bodyHeader = Buffer.alloc(44);
  bodyHeader.writeBigInt64LE(getUserId(), 0);
  Buffer.from(getAuthToken()).copy(bodyHeader, 8);
  bodyHeader.writeUint16LE(recordCount, 40);
  return bodyHeader;
}
