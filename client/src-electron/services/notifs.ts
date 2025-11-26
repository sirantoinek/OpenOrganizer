/*
 * Authors: Michael Jagiello
 * Created: 2025-11-08
 * Updated: 2025-11-25
 *
 * This file defines all main functionality for creating, maintaining, and executing notifcations based on reminders and generated reminders.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import * as cron from 'node-cron'
import { Notification } from 'electron';
import { getDayOfYear, type Timestamp } from '@quasar/quasar-ui-qcalendar';
import { convertTimeAndDateToTimestamp } from "src/frontend-utils/time";
import type { GeneratedReminder, Override, Reminder, RangeWindow } from "../types/shared-types";
import { readRemindersInRange, readGeneratedRemindersInRange } from "../db/sqlite-db";

interface Notif {
  itemID: bigint,
  origEventStartTime?: bigint,
  time: bigint,
  title: string,
  body: string
}

// all loaded reminders and generated reminders are loaded as notifs (this should never be large enough for a full iteration to matter)
// key is (itemID << 64) | (origEventStartTime | itemID)
const notifications = new Map<bigint, Notif>();

export function InitNotifications() {
  // run at the start of every minute
  cron.schedule("* * * * *", () => { CheckNotifications() });
  // ensure that all notifications for current day are loaded
  void PullToday();
  cron.schedule("0 0 * * *", () => { void PullToday() });
}

function CheckNotifications() {
  const now = GetNowTime();
  for (const [key, notif] of notifications) {
    if (notif.time == now) {
      Notify(notif);
    }
  }
}

async function PullToday() {
  await sleep(10);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const minuteOfToday = (hour * 60 + minute);
  const dateString = year.toString() + "-" + month.toString() + "-" + day.toString();
  const startToday = convertTimeAndDateToTimestamp(dateString, "00:00");
  const startMinOfYear = getDayOfYear(startToday) * 1440 + startToday.hour * 60 + startToday.minute;
  const rangeWindow: RangeWindow = {
    startYear: year,
    startMinOfYear: startMinOfYear,
    endYear: year,
    endMinOfYear: startMinOfYear + 1439
  };
  const reminders = readRemindersInRange(rangeWindow);
  const generated = readGeneratedRemindersInRange(rangeWindow);
  if (reminders != undefined) {
    for (const reminder of reminders) {
      if (reminder.notifYear == year && 
          reminder.notifDay == getDayOfYear(startToday) && 
          reminder.notifMin == minuteOfToday) {
        const notif = ReminderToNotif(reminder);
        Notify(notif);
      }
    }
  }
  if (generated != undefined) {
    for (const reminder of generated) {
      if (reminder.notifYear == year && 
          reminder.notifDay == getDayOfYear(startToday) && 
          reminder.notifMin == minuteOfToday) {
        const notif = GeneratedToNotif(reminder);
        Notify(notif);
      }
    }
  }
}

function Notify(notif: Notif) {
  new Notification({ title: notif.title, body: notif.body }).show();
}

// set / delete

// adds or updates reminder for notification details
// only adds if hasNotif == true and is InFuture, else deletes
export function SetNotifReminder(reminder: Reminder) {
  if (!reminder.hasNotif || !InNearFuture(reminder)) {
    DeleteNotif(reminder.itemID);
    return false;
  }
  const notif = ReminderToNotif(reminder);
  notifications.set(CombineBigints64(notif.itemID, notif.itemID), notif);
  return true;
}

// adds or updates generated reminder for notification details
// only adds if hasNotif == true and is InFuture, else deletes
export function SetNotifGenerated(reminder: GeneratedReminder) {
  if (!reminder.hasNotif || !InNearFuture(reminder)) {
    DeleteNotifGenerated(reminder);
    return false;
  }
  const notif = GeneratedToNotif(reminder);
  notifications.set(CombineBigints64(notif.itemID, notif.origEventStartTime!), notif);
  return true;
}

// these are asymmetrical due to how handlers vary between reminder and generated methods - this reduces querying

// deletes notification
export function DeleteNotif(itemID: bigint) {
  return notifications.delete(CombineBigints64(itemID, itemID));
}

// deletes notification
export function DeleteNotifGenerated(reminder: GeneratedReminder) {
  return notifications.delete(CombineBigints64(reminder.itemID, TimeToBigint(reminder.origEventStartYear, reminder.origEventStartDay, reminder.origEventStartMin)));
}

// helpers

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ReminderToNotif(reminder: Reminder) {
  const notif: Notif = {
    itemID: reminder.itemID,
    time: TimeToBigint(reminder.notifYear, reminder.notifDay, reminder.notifMin),
    title: reminder.title,
    body: ""
  };
  return notif;
}

function GeneratedToNotif(reminder: GeneratedReminder) {
  const notif: Notif = {
    itemID: reminder.itemID,
    origEventStartTime: TimeToBigint(reminder.origEventStartYear, reminder.origEventStartDay, reminder.origEventStartMin),
    time: TimeToBigint(reminder.notifYear, reminder.notifDay, reminder.notifMin),
    title: reminder.title,
    body: ""
  };
  return notif;
}

function GetNowTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dateString = year.toString() + "-" + month.toString() + "-" + day.toString();
  const timeString = hour.toString() + ":" + minute.toString() + ":00";
  return convertTimeAndDateToTimestamp(dateString, timeString);
}

// gets current time, formatted as a bigint with 4 bytes for year, 2 bytes for day of year, and 2 bytes for minute
function GetNowTime() {
  return TimestampToBigint(GetNowTimestamp());
}

// converts Timestamp into a bigint
function TimestampToBigint(time: Timestamp) {
  const buf = Buffer.alloc(8);
  buf.writeUint32LE(time.year, 0);
  buf.writeUint16LE(getDayOfYear(time), 4);
  buf.writeUint16LE((time.hour * 60) + time.minute, 6);
  return buf.readBigInt64LE();
}

// converts year+day+minute into a bigint
function TimeToBigint(year: number, day: number, minute: number) {
  const buf = Buffer.alloc(8);
  buf.writeUint32LE(year, 0);
  buf.writeUint16LE(day, 4);
  buf.writeUint16LE(minute, 6);
  return buf.readBigInt64LE();
}

// concatenates two 64-bit bigints
function CombineBigints64(a: bigint, b: bigint) {
  return (a << 64n) | b;
}

function InNearFuture(reminder: Reminder | GeneratedReminder) {
  const nowYear = new Date().getFullYear();
  return reminder.notifYear == nowYear || reminder.notifYear == nowYear + 1;
}
