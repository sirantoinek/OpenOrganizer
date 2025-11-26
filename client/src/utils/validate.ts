/*
 * Authors: Michael Jagiello
 * Created: 2025-11-11
 * Updated: 2025-11-18
 *
 * This file defines helper validation functions for user inputs.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import type {
  Note,
  Extension,
  Folder,
  Reminder,
  DailyReminder,
  WeeklyReminder,
  MonthlyReminder,
  YearlyReminder,
  Deleted,
  Flight,
  Hotel
} from "app/src-electron/types/shared-types";

// disallows undefined, length < minLength or length > maxLength
// returns "" upon success or an error message upon fail using the optional stringName | "string"
export function ValidateString(str: string | undefined, minLength: number, maxLength: number, stringName?: string) {
  if (stringName == undefined) stringName = "string";
  if (str == undefined) return stringName + " is undefined";
  if (str.length < minLength) return stringName + " must be at least " + minLength.toString() + " characters long";
  if (str.length > maxLength) return stringName + " must be at most "  + maxLength.toString() + " characters long";
  if (str.includes("\0")) return stringName + " must not include null terminators, and I have no clue how you pulled this off";
  return "";
}

export function MatchStrings(str1: string, str2: string, stringName?: string) {
  if (stringName == undefined) stringName = "string";
  if (str1 != str2) return stringName + " does not match";
  return "";
}

export function PadString(str: string | undefined, length: number) {
  if (str == undefined) str = "";
  return str + "\0".repeat(length - str.length);
}

export function UnpadString(str: string | undefined) {
  if (str == undefined) str = "";
  return str.replaceAll("\0", "");
}

function WithinInt16(value: number, valueName?: string) {
  if (valueName == undefined) valueName = "value";
  const min: number = -65536;
  const max: number =  65535;
  if (value < min || value > max) return valueName + " must be within a signed 16 bit integer";
  return "";
}

function WithinInt32(value: number, valueName?: string) {
  if (valueName == undefined) valueName = "value";
  const min: number = -2147483648;
  const max: number =  2147483647;
  if (value < min || value > max) return valueName + " must be within a signed 32 bit integer";
  return "";
}

function WithinInt64(value: bigint, valueName?: string) {
  if (valueName == undefined) valueName = "value";
  const min: bigint = -9223372036854775808n;
  const max: bigint =  9223372036854775807n;
  if (value < min || value > max) return valueName + " must be within a signed 64 bit integer";
  return "";
}

// disallows empty, length < 8, length > 32, spaces, apostrophes (single quotes), double quotes, and nulls
// returns "" upon success or an error message upon fail
export function ValidateUsername(username: string) {
  if (username == "") return "username must not be empty";
  let ret = "";
  if ((ret = ValidateString(username, 8, 32, "username")) != "") return ret;
  if (username.includes(" ")) return "username must not include any spaces";
  if (username.includes("'")) return "username must not include any apostrophes";
  if (username.includes("\"")) return "username must not include any quotes";
  if (username.includes("\0")) return "username must not include null terminators, and I have no clue how you pulled this off";
  return "";
}

// disallows empty, length < 8, length > 32, spaces, apostrophes (single quotes), double quotes, and nulls
// returns "" upon success or an error message upon fail
export function ValidatePassword(password: string) {
  if (password == "") return "password must not be empty";
  let ret = "";
  if ((ret = ValidateString(password, 8, 32, "password")) != "") return ret;
  if (password.includes(" ")) return "password must not include any spaces";
  if (password.includes("'")) return "password must not include any apostrophes";
  if (password.includes("\"")) return "password must not include any quotes";
  if (password.includes("\0")) return "password must not include null terminators, and I have no clue how you pulled this off";
  return "";
}

// tables

export function ValidateNote(note: Note) {
  let ret = "";
  if ((ret = WithinInt64(note.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(note.lastModified)) != "lastModified") return ret;
  if ((ret = ValidateString(note.title, 1, 48, "title")) != "") return ret;
  if ((ret = ValidateString(note.text, 0, 64, "text")) != "") return ret;
  return "";
}

export function ValidateReminder(reminder: Reminder) {
  let ret = "";
  if ((ret = WithinInt64(reminder.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(reminder.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt64(reminder.folderID, "folderID")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventType, "eventType")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventStartYear, "eventStartYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.eventStartDay, "eventStartDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.eventStartMin, "eventStartMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventEndYear, "eventEndYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.eventEndDay, "eventEndDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.eventEndMin, "eventEndMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.notifYear, "notifYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.notifDay, "notifDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.notifMin, "notifMin")) != "") return ret;
  if ((ret = ValidateString(reminder.title, 1, 48, "title")) != "") return ret;
  if (reminder.eventEndYear < reminder.eventStartYear) return "end time must not be before start time";
  if (reminder.eventEndYear == reminder.eventStartYear && reminder.eventEndDay < reminder.eventStartDay) return "end time must not be before start time";
  if (reminder.eventEndYear == reminder.eventStartYear && reminder.eventEndDay == reminder.eventStartDay && reminder.eventEndMin < reminder.eventStartMin) return "end time must not be before start time";
  return "";
}

export function ValidateDailyReminder(reminder: DailyReminder) {
  let ret = "";
  if ((ret = WithinInt64(reminder.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(reminder.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt64(reminder.folderID, "folderID")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventType, "eventType")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesStartYear, "seriesStartYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartDay, "seriesStartDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartMin, "seriesStartMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesEndYear, "seriesEndYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndDay, "seriesEndDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndMin, "seriesEndMin")) != "") return ret;
  if ((ret = WithinInt16(reminder.timeOfDayMin, "timeOfDayMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventDurationMin, "eventDurationMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.notifOffsetTimeMin, "notifOffsetTimeMin")) != "") return ret;
  if ((ret = WithinInt16(reminder.everyNDays, "everyNDays")) != "") return ret;
  if ((ret = ValidateString(reminder.title, 1, 48, "title")) != "") return ret;
  if (reminder.seriesEndYear < reminder.seriesStartYear) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay < reminder.seriesStartDay) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay == reminder.seriesStartDay && reminder.seriesEndMin < reminder.seriesStartMin) return "series end time must be after start time";
  if (reminder.eventDurationMin < 0) return "event duration must not be negative";
  return "";
}

export function ValidateWeeklyReminder(reminder: WeeklyReminder) {
  let ret = "";
  if ((ret = WithinInt64(reminder.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(reminder.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt64(reminder.folderID, "folderID")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventType, "eventType")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesStartYear, "seriesStartYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartDay, "seriesStartDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartMin, "seriesStartMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesEndYear, "seriesEndYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndDay, "seriesEndDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndMin, "seriesEndMin")) != "") return ret;
  if ((ret = WithinInt16(reminder.timeOfDayMin, "timeOfDayMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventDurationMin, "eventDurationMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.notifOffsetTimeMin, "notifOffsetTimeMin")) != "") return ret;
  if ((ret = WithinInt16(reminder.everyNWeeks, "everyNWeeks")) != "") return ret;
  if ((ret = ValidateString(reminder.title, 1, 48, "title")) != "") return ret;
  if (reminder.seriesEndYear < reminder.seriesStartYear) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay < reminder.seriesStartDay) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay == reminder.seriesStartDay && reminder.seriesEndMin < reminder.seriesStartMin) return "series end time must be after start time";
  if (reminder.eventDurationMin < 0) return "event duration must not be negative";
  return "";
}

export function ValidateMonthlyReminder(reminder: MonthlyReminder) {
  let ret = "";
  if ((ret = WithinInt64(reminder.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(reminder.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt64(reminder.folderID, "folderID")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventType, "eventType")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesStartYear, "seriesStartYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartDay, "seriesStartDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartMin, "seriesStartMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesEndYear, "seriesEndYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndDay, "seriesEndDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndMin, "seriesEndMin")) != "") return ret;
  if ((ret = WithinInt16(reminder.timeOfDayMin, "timeOfDayMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventDurationMin, "eventDurationMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.notifOffsetTimeMin, "notifOffsetTimeMin")) != "") return ret;
  if ((ret = ValidateString(reminder.title, 1, 48, "title")) != "") return ret;
  if (reminder.seriesEndYear < reminder.seriesStartYear) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay < reminder.seriesStartDay) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay == reminder.seriesStartDay && reminder.seriesEndMin < reminder.seriesStartMin) return "series end time must be after start time";
  if (reminder.eventDurationMin < 0) return "event duration must not be negative";
  return "";
}

export function ValidateYearlyReminder(reminder: YearlyReminder) {
  let ret = "";
  if ((ret = WithinInt64(reminder.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(reminder.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt64(reminder.folderID, "folderID")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventType, "eventType")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesStartYear, "seriesStartYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartDay, "seriesStartDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesStartMin, "seriesStartMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.seriesEndYear, "seriesEndYear")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndDay, "seriesEndDay")) != "") return ret;
  if ((ret = WithinInt16(reminder.seriesEndMin, "seriesEndMin")) != "") return ret;
  if ((ret = WithinInt16(reminder.timeOfDayMin, "timeOfDayMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.eventDurationMin, "eventDurationMin")) != "") return ret;
  if ((ret = WithinInt32(reminder.notifOffsetTimeMin, "notifOffsetTimeMin")) != "") return ret;
  if ((ret = ValidateString(reminder.title, 1, 48, "title")) != "") return ret;
  if (reminder.seriesEndYear < reminder.seriesStartYear) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay < reminder.seriesStartDay) return "series end time must be after start time";
  if (reminder.seriesEndYear == reminder.seriesStartYear && reminder.seriesEndDay == reminder.seriesStartDay && reminder.seriesEndMin < reminder.seriesStartMin) return "series end time must be after start time";
  if (reminder.eventDurationMin < 0) return "event duration must not be negative";
  return "";
}

// requires that the data is the full 64 bytes long
export function ValidateExtension(extension: Extension) {
  let ret = "";
  if ((ret = WithinInt64(extension.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt32(extension.sequenceNum, "sequenceNum")) != "") return ret;
  if ((ret = WithinInt64(extension.lastModified, "lastModified")) != "") return ret;
  if ((ret = ValidateString(extension.data, 64, 64, "data")) != "") return ret;
  return "";
}

export function ValidateFolder(folder: Folder) {
  let ret = "";
  if ((ret = WithinInt64(folder.folderID, "folderID")) != "") return ret;
  if ((ret = WithinInt64(folder.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt64(folder.parentFolderID, "parentFolderID")) != "") return ret;
  if ((ret = WithinInt32(folder.colorCode, "colorCode")) != "") return ret;
  if ((ret = ValidateString(folder.folderName, 1, 24, "folderName")) != "") return ret;
  return "";
}

export function ValidateDeleted(deleted: Deleted) {
  let ret = "";
  if ((ret = WithinInt64(deleted.itemID, "itemID")) != "") return ret;
  if ((ret = WithinInt64(deleted.lastModified, "lastModified")) != "") return ret;
  if ((ret = WithinInt16(deleted.itemTable, "itemTable")) != "") return ret;
  return "";
}

// eventTypes

export function ValidateFlight(flight: Flight) {
  let ret = "";
  if ((ret = ValidateString(flight.depAirportName, 0, 64)) != "") return ret;
  if ((ret = ValidateString(flight.depAirportAddress, 0, 64)) != "") return ret;
  if ((ret = ValidateString(flight.arrAirportName, 0, 64)) != "") return ret;
  if ((ret = ValidateString(flight.arrAirportAddress, 0, 64)) != "") return ret;
  if ((ret = ValidateString(flight.airlineCode, 0, 8)) != "") return ret;
  if ((ret = ValidateString(flight.flightNumber, 0, 8)) != "") return ret;
  if ((ret = ValidateString(flight.airlineName, 0, 48)) != "") return ret;
  if ((ret = ValidateString(flight.depAirportIATA, 0, 3)) != "") return ret;
  if ((ret = ValidateString(flight.depTimezoneAbbr, 0, 5)) != "") return ret;
  if ((ret = ValidateString(flight.boardingGroup, 0, 2)) != "") return ret;
  if ((ret = ValidateString(flight.gate, 0, 4)) != "") return ret;
  if ((ret = ValidateString(flight.depTimezoneOffset, 0, 1)) != "") return ret;
  if ((ret = ValidateString(flight.arrTimezoneOffset, 0, 1)) != "") return ret;
  if ((ret = ValidateString(flight.arrAirportIATA, 0, 3)) != "") return ret;
  if ((ret = ValidateString(flight.arrTimezoneAbbr, 0, 5)) != "") return ret;
  return "";
}

export function ValidateHotel(hotel: Hotel) {
  let ret = "";
  if ((ret = ValidateString(hotel.name, 0, 64)) != "") return ret;
  if ((ret = ValidateString(hotel.address, 0, 128)) != "") return ret;
  if ((ret = ValidateString(hotel.timezoneAbbrev, 0, 5)) != "") return ret;
  if ((ret = ValidateString(hotel.timezoneOffset, 0, 1)) != "") return ret;
  if ((ret = ValidateString(hotel.roomNumber, 0, 10)) != "") return ret;
  return "";
}
