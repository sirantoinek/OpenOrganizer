/*
 * Authors: Kevin Sirantoine, Michael Jagiello
 * Created: 2025-10-13
 * Updated: 2025-11-07
 *
 * This file contains interfaces that are shared between the main and renderer processes to easily pass database entries and other values.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

// table rows

export interface Note {
  itemID: bigint;
  lastModified: bigint;
  folderID: bigint;
  isExtended: number;
  title: string;
  text: string;
  extensions?: Extension[];
}

export interface Extension {
  itemID: bigint;
  sequenceNum: number;
  lastModified: bigint;
  data: string;
}

export interface Folder {
  folderID: bigint;
  lastModified: bigint;
  parentFolderID: bigint;
  colorCode: number;
  folderName: string;
}

export interface Reminder {
  itemID: bigint;
  lastModified: bigint;
  folderID: bigint;
  eventType: number;
  eventStartYear: number;
  eventStartDay: number;
  eventStartMin: number;
  eventEndYear: number;
  eventEndDay: number;
  eventEndMin: number;
  notifYear: number;
  notifDay: number;
  notifMin: number;
  isExtended: number;
  hasNotif: number;
  title: string;
  extensions?: Extension[];
}

export interface DailyReminder {
  itemID: bigint;
  lastModified: bigint;
  folderID: bigint;
  eventType: number;
  seriesStartYear: number;
  seriesStartDay: number;
  seriesStartMin: number;
  seriesEndYear: number;
  seriesEndDay: number;
  seriesEndMin: number;
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number;
  hasNotifs: number;
  isExtended: number;
  everyNDays: number;
  title: string;
  extensions?: Extension[];
}

export interface WeeklyReminder {
  itemID: bigint;
  lastModified: bigint;
  folderID: bigint;
  eventType: number;
  seriesStartYear: number;
  seriesStartDay: number;
  seriesStartMin: number;
  seriesEndYear: number;
  seriesEndDay: number;
  seriesEndMin: number;
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number;
  hasNotifs: number;
  isExtended: number;
  everyNWeeks: number;
  daysOfWeek: string;
  title: string;
  extensions?: Extension[];
}

export interface MonthlyReminder {
  itemID: bigint;
  lastModified: bigint;
  folderID: bigint;
  eventType: number;
  seriesStartYear: number;
  seriesStartDay: number;
  seriesStartMin: number;
  seriesEndYear: number;
  seriesEndDay: number;
  seriesEndMin: number;
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number;
  hasNotifs: number;
  isExtended: number;
  lastDayOfMonth: number;
  daysOfMonth: string;
  title: string;
  extensions?: Extension[];
}

export interface YearlyReminder {
  itemID: bigint;
  lastModified: bigint;
  folderID: bigint;
  eventType: number;
  seriesStartYear: number;
  seriesStartDay: number;
  seriesStartMin: number;
  seriesEndYear: number;
  seriesEndDay: number;
  seriesEndMin: number;
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number;
  hasNotifs: number;
  isExtended: number;
  dayOfYear: number;
  title: string;
  extensions?: Extension[];
}

export interface GeneratedReminder {
  itemID: bigint;
  folderID: bigint;
  eventType: number;
  recurrenceTable: number;
  origEventStartYear: number;
  origEventStartDay: number;
  origEventStartMin: number;
  eventStartYear: number;
  eventStartDay: number;
  eventStartMin: number;
  eventEndYear: number;
  eventEndDay: number;
  eventEndMin: number;
  notifYear: number;
  notifDay: number;
  notifMin: number;
  isExtended: number;
  hasNotif: number;
  title: string;
  extensions?: Extension[];
}

export interface Override {
  itemID: bigint;
  linkedItemID: bigint;
  lastModified: bigint;
  origEventStartYear: number;
  origEventStartDay: number;
  origEventStartMin: number;
  eventStartYear: number;
  eventStartDay: number;
  eventStartMin: number;
  eventEndYear: number;
  eventEndDay: number;
  eventEndMin: number;
  notifYear: number;
  notifDay: number;
  notifMin: number;
  hasNotif: number;
}

export interface Deleted {
  itemID: bigint;
  lastModified: bigint;
  itemTable: number;
}

// event types

export interface Flight {
  itemID: bigint;
  lastModified: bigint;
  depAirportName: string; // 64
  depAirportAddress: string; // 64
  arrAirportName: string; // 64
  arrAirportAddress: string; // 64
  airlineCode: string; // 8
  flightNumber: string; // 8
  airlineName: string; // 48
  depAirportIATA: string; // 3
  depTimezoneAbbr: string // 5
  depTimeYear: number;
  depTimeDay: number;
  depTimeMin: number;
  depTimeDestZoneYear: number;
  depTimeDestZoneDay: number;
  depTimeDestZoneMin: number;
  boardingTimeYear: number;
  boardingTimeDay: number;
  boardingTimeMin: number;
  boardingGroup: string; // 2
  gate: string; // 4
  depTimezoneOffset: string; // 1
  arrTimezoneOffset: string; // 1
  arrAirportIATA: string; // 3
  arrTimezoneAbbr: string; // 5
  arrTimeYear: number;
  arrTimeDay: number;
  arrTimeMin: number;
  arrTimeDestZoneYear: number;
  arrTimeDestZoneDay: number;
  arrTimeDestZoneMin: number;
}

export interface Hotel {
  itemID: bigint;
  lastModified: bigint;
  name: string; // 64
  address: string; // 128
  checkinTimeYear: number;
  checkinTimeDay: number;
  checkinTimeMin: number;
  checkoutTimeYear: number;
  checkoutTimeDay: number;
  checkoutTimeMin: number;
  timezoneAbbrev: string; // 5
  timezoneOffset: string; // 1
  roomNumber: string; // 10
}

// other interfaces

export interface RangeWindow {
  startYear: number;
  startMinOfYear: number;
  endYear: number;
  endMinOfYear: number;
}
