/*
 * Authors: Kevin Sirantoine
 * Created: 2025-10-30
 * Updated: 2025-12-02
 *
 * This file defines functions for sending syncdown requests.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import * as unpack from "../utils/unpack";
import { getAuthToken, getUserId, loginAccount } from "app/src-electron/services/auth";
import { sendRequest, logResponse } from "../utils/sync-utils";
import { lastUpdated } from "app/src-electron/services/store";
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

export async function syncdown(serverAddr: string) {
  let serverLastUp = await lastUp(serverAddr);
  if (serverLastUp === undefined) { // If lastUp fails, attempt login, try again, return undefined if login or lastup fails
    if (await loginAccount()) serverLastUp = await lastUp(serverAddr);
    if (serverLastUp === undefined) return undefined;
  }

  const localLastUpFolders = Buffer.from(lastUpdated.get('lastUpFolders')).readBigInt64LE(0);
  const localLastUpNotes = Buffer.from(lastUpdated.get('lastUpNotes')).readBigInt64LE(0);
  const localLastUpReminders = Buffer.from(lastUpdated.get('lastUpReminders')).readBigInt64LE(0);
  const localLastUpDaily = Buffer.from(lastUpdated.get('lastUpDaily')).readBigInt64LE(0);
  const localLastUpWeekly = Buffer.from(lastUpdated.get('lastUpWeekly')).readBigInt64LE(0);
  const localLastUpMonthly = Buffer.from(lastUpdated.get('lastUpMonthly')).readBigInt64LE(0);
  const localLastUpYearly = Buffer.from(lastUpdated.get('lastUpYearly')).readBigInt64LE(0);
  const localLastUpExtensions = Buffer.from(lastUpdated.get('lastUpExtensions')).readBigInt64LE(0);
  const localLastUpOverrides = Buffer.from(lastUpdated.get('lastUpOverrides')).readBigInt64LE(0);
  const localLastUpDeleted = Buffer.from(lastUpdated.get('lastUpDeleted')).readBigInt64LE(0);

  return {
    folders: (localLastUpFolders < serverLastUp.lastUpFolders) ? await downFolders(localLastUpFolders, serverAddr) : undefined,
    notes: (localLastUpNotes < serverLastUp.lastUpNotes) ? await downNotes(localLastUpNotes, serverAddr) : undefined,
    reminders: (localLastUpReminders < serverLastUp.lastUpReminders) ? await downReminders(localLastUpReminders, serverAddr) : undefined,
    dailyReminders: (localLastUpDaily < serverLastUp.lastUpDaily) ? await downRemindersDaily(localLastUpDaily, serverAddr) : undefined,
    weeklyReminders: (localLastUpWeekly < serverLastUp.lastUpWeekly) ? await downRemindersWeekly(localLastUpWeekly, serverAddr) : undefined,
    monthlyReminders: (localLastUpMonthly < serverLastUp.lastUpMonthly) ? await downRemindersMonthly(localLastUpMonthly, serverAddr) : undefined,
    yearlyReminders: (localLastUpYearly < serverLastUp.lastUpYearly) ? await downRemindersYearly(localLastUpYearly, serverAddr) : undefined,
    extensions: (localLastUpExtensions < serverLastUp.lastUpExtensions) ? await downExtensions(localLastUpExtensions, serverAddr) : undefined,
    overrides: (localLastUpOverrides < serverLastUp.lastUpOverrides) ? await downOverrides(localLastUpOverrides, serverAddr) : undefined,
    deletes: (localLastUpDeleted < serverLastUp.lastUpDeleted) ? await downDeleted(localLastUpDeleted, serverAddr) : undefined,
  } as RetrievedItems;
}

export async function lastUp(serverAddr: string) {
  const body = Buffer.alloc(40);
  body.writeBigInt64LE(getUserId(), 0);
  Buffer.from(getAuthToken()).copy(body, 8);
  const url = serverAddr + "lastupdated";

  const response = await sendRequest(url, body);
  if (response === undefined) return undefined;

  return unpack.unpackLastUp(Buffer.from(response.data as ArrayBuffer));
}

export async function downNotes(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/notes"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackNotes(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downReminders(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/reminders"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackReminders(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downRemindersDaily(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/reminders/daily"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackDailyReminders(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downRemindersWeekly(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/reminders/weekly"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackWeeklyReminders(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downRemindersMonthly(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/reminders/monthly"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackMonthlyReminders(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downRemindersYearly(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/reminders/yearly"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackYearlyReminders(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downExtensions(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/extensions"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackExtensions(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downOverrides(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/overrides"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackOverrides(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downFolders(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/folders"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackFolders(reqDetails.repeatedData, reqDetails.recordCount);
}

export async function downDeleted(startTime: bigint, serverAddr: string) {
  const url = serverAddr + "syncdown/deleted"

  const reqDetails = await requestDownDetails(startTime, url);
  if (reqDetails === undefined) return undefined;

  return unpack.unpackDeleted(reqDetails.repeatedData, reqDetails.recordCount);
}


// helpers
function getBody(startTime: bigint) {
  const body = Buffer.alloc(56);
  body.writeBigInt64LE(getUserId(), 0);
  Buffer.from(getAuthToken()).copy(body, 8);
  body.writeBigInt64LE(startTime, 40);
  body.writeBigInt64LE(9223372036854775807n, 48); // endTime = 2^63 - 1
  return body;
}

async function requestDownDetails(startTime: bigint, url: string) {
  const body = getBody(startTime);

  const response = await sendRequest(url, body);
  if (response === undefined) return undefined;
  logResponse(url, response);

  const data = Buffer.from(response.data as ArrayBuffer);

  const recordCount = data.readInt32LE(0);
  const repeatedData = data.subarray(4);

  return {recordCount, repeatedData} as RequestDetails;
}

interface RequestDetails {
  recordCount: number,
  repeatedData: Buffer
}

export interface RetrievedItems {
  folders: Folder[],
  notes: Note[],
  reminders: Reminder[],
  dailyReminders: DailyReminder[]
  weeklyReminders: WeeklyReminder[],
  monthlyReminders: MonthlyReminder[],
  yearlyReminders: YearlyReminder[],
  extensions: Extension[],
  overrides: Override[],
  deletes: Deleted[]
}
