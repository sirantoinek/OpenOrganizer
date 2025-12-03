/*
 * Authors: Kevin Sirantoine
 * Created: 2025-11-07
 * Updated: 2025-11-13
 *
 * This file contains functions for generating the generated reminders to be inserted into the local database in sqlite-db.ts.
 *
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import * as db from "app/src-electron/db/sqlite-db";
import {
  type Timestamp,
  getDayOfYear,
  isLeapYear,
  daysInMonth,
  parseDate,
  updateMinutes,
  addToDate,
  copyTimestamp,
  diffTimestamp,
  daysBetween
} from '@quasar/quasar-ui-qcalendar';
import type {
  DailyReminder,
  WeeklyReminder,
  MonthlyReminder,
  YearlyReminder,
  GeneratedReminder,
  Override,
  RangeWindow,
} from "app/src-electron/types/shared-types";

const generatedYears = new Set<number>(); // maintain a set of currently generated years

export function getGeneratedYears() { // for use in sqlite-db.ts and init
  return generatedYears;
}

export function generateAllInYear(year: number) {
  const rangeWindow = yearToRangeWindow(year);
  const generatedRems: GeneratedReminder[] = [];

  const dailys = db.readDailyRemindersInRange(rangeWindow);
  const weeklys = db.readWeeklyRemindersInRange(rangeWindow);
  const monthlys = db.readMonthlyRemindersInRange(rangeWindow);
  const yearlys = db.readYearlyRemindersInRange(rangeWindow);

  if (dailys !== undefined) for (const daily of dailys) generatedRems.push(...generateDaily(daily, year));
  if (weeklys !== undefined) for (const weekly of weeklys) generatedRems.push(...generateWeekly(weekly, year));
  if (monthlys !== undefined) for (const monthly of monthlys) generatedRems.push(...generateMonthly(monthly, year));
  if (yearlys !== undefined) for (const yearly of yearlys) generatedRems.push(...generateYearly(yearly, year));

  generatedYears.add(year); // update generatedYears set
  return generatedRems
}

export function generateDaily(daily: DailyReminder, year: number) {
  const rangeWindow = yearToRangeWindow(year);

  const dailyStartTime = parseDate(new Date(daily.seriesStartYear, 0, daily.seriesStartDay, 0, 0))!;
  const windowStartTime = parseDate(new Date(rangeWindow.startYear, 0, 1, 0, rangeWindow.startMinOfYear))!;
  const {startTime, endTime} = getGenWindow(daily, rangeWindow);
  let currTime = copyTimestamp(startTime);

  // ensure that the startTime is actually a recurrence day
  const diff = daysBetween(dailyStartTime, windowStartTime); // windowStart - seriesStart
  if (diff > 0) {
    const daysSinceRecur = diff % daily.everyNDays;
    if (daysSinceRecur > 0) currTime = addToDate(currTime, {day: daily.everyNDays - daysSinceRecur}); // move to first recur day within the window
  }

  currTime = updateMinutes(currTime, daily.timeOfDayMin); // add timeOfDayMin

  const eventStartTimes: Timestamp[] = [];
  const eventEndTimes: Timestamp[] = [];
  const notifTimes: Timestamp[] = [];
  while (diffTimestamp(currTime, endTime, false) >= 0) { // while currTime <= endTime
    eventStartTimes.push(currTime);
    eventEndTimes.push(addToDate(currTime, {minute: daily.eventDurationMin}));
    notifTimes.push(addToDate(currTime, {minute: daily.notifOffsetTimeMin}));
    currTime = addToDate(currTime, {day: daily.everyNDays});
  }

  const overridesMap = getOverridesMap(daily.itemID);
  const generatedRems: GeneratedReminder[] = [];
  if (overridesMap !== undefined) {
    for (const override of overridesMap.values()) {
      // assume overrides only set event start time within the series start and end times
      if (override.eventStartYear === year) generatedRems.push(getGeneratedRemFromOverride(1, daily, override)); // only generate for overrides that fall within the year window
    }
  }

  for (let i = 0; i < eventStartTimes.length; i++) {
    if (overridesMap !== undefined) {
      const {year: origEventStartYear, day: origEventStartDay, min: origEventStartMin} = getYearDayMin(eventStartTimes[i]!);
      const origStartTime: OrigStartTime = { origEventStartYear, origEventStartDay, origEventStartMin };
      if (overridesMap.get(origStartTime) !== undefined) continue;
    }
    generatedRems.push(getGeneratedRem(1, daily, eventStartTimes[i]!, eventEndTimes[i]!, notifTimes[i]!));
  }

  return generatedRems;
}

export function generateWeekly(weekly: WeeklyReminder, year: number) {
  const rangeWindow = yearToRangeWindow(year);

  const weeklyStartTime = parseDate(new Date(weekly.seriesStartYear, 0, weekly.seriesStartDay, 0, 0))!;
  const windowStartTime = parseDate(new Date(rangeWindow.startYear, 0, 1, 0, rangeWindow.startMinOfYear))!;
  const {startTime, endTime} = getGenWindow(weekly, rangeWindow);
  let currTime = copyTimestamp(startTime);

  // ensure that the startTime is actually within a recurring week
  let firstDayOfWeeklyStartWeek = copyTimestamp(weeklyStartTime);
  if (weeklyStartTime.weekday > 0) firstDayOfWeeklyStartWeek = addToDate(weeklyStartTime, {day: (-weeklyStartTime.weekday)});
  let firstDayOfWindowStartWeek = copyTimestamp(windowStartTime);
  if (windowStartTime.weekday > 0) firstDayOfWindowStartWeek = addToDate(windowStartTime, {day: (-windowStartTime.weekday)});

  const diff = daysBetween(firstDayOfWeeklyStartWeek, firstDayOfWindowStartWeek); // firstDayOfWindowStartWeek - firstDayOfStartWeek
  if (diff > 0) {
    const weeksSinceStartWeek = Math.floor(diff / 7);
    const weeksSinceRecur = weeksSinceStartWeek % weekly.everyNWeeks;

    if (weeksSinceRecur > 0) currTime = addToDate(firstDayOfWindowStartWeek, {day: ((weekly.everyNWeeks - weeksSinceRecur) * 7) }); // move to start of first recur week within the window
  }

  currTime = updateMinutes(currTime, weekly.timeOfDayMin); // add timeOfDayMin

  const eventStartTimes: Timestamp[] = [];
  const eventEndTimes: Timestamp[] = [];
  const notifTimes: Timestamp[] = [];
  while (diffTimestamp(currTime, endTime, false) >= 0) { // while currTime <= endTime
    for (let i = currTime.weekday; i < 7; i++) {
      if (diffTimestamp(currTime, endTime, false) < 0) break; // break if currTime > endTime

      if (weekly.daysOfWeek[i] === '1') {
        eventStartTimes.push(currTime);
        eventEndTimes.push(addToDate(currTime, {minute: weekly.eventDurationMin}));
        notifTimes.push(addToDate(currTime, {minute: weekly.notifOffsetTimeMin}));
      }
      currTime = addToDate(currTime, {day: 1});
    }
    currTime = addToDate(currTime, {day: ((weekly.everyNWeeks - 1) * 7)});
  }

  const overridesMap = getOverridesMap(weekly.itemID);
  const generatedRems: GeneratedReminder[] = [];
  if (overridesMap !== undefined) {
    for (const override of overridesMap.values()) {
      // assume overrides only set event start time within the series start and end times
      if (override.eventStartYear === year) generatedRems.push(getGeneratedRemFromOverride(2, weekly, override)); // only generate for overrides that fall within the year window
    }
  }

  for (let i = 0; i < eventStartTimes.length; i++) {
    if (overridesMap !== undefined) {
      const {year: origEventStartYear, day: origEventStartDay, min: origEventStartMin} = getYearDayMin(eventStartTimes[i]!);
      const origStartTime: OrigStartTime = { origEventStartYear, origEventStartDay, origEventStartMin };
      if (overridesMap.get(origStartTime) !== undefined) continue;
    }
    generatedRems.push(getGeneratedRem(2, weekly, eventStartTimes[i]!, eventEndTimes[i]!, notifTimes[i]!));
  }

  return generatedRems;
}

export function generateMonthly(monthly: MonthlyReminder, year: number) {
  const rangeWindow = yearToRangeWindow(year);

  const {startTime, endTime} = getGenWindow(monthly, rangeWindow);
  let currTime = updateMinutes(startTime, monthly.timeOfDayMin); // add timeOfDayMin

  const eventStartTimes: Timestamp[] = [];
  const eventEndTimes: Timestamp[] = [];
  const notifTimes: Timestamp[] = [];
  while (diffTimestamp(currTime, endTime, false) >= 0) { // while currTime <= endTime
    const daysInMo = daysInMonth(currTime.year, currTime.month);
    let lastDayOfMonthSet = false;

    for (let i = currTime.day; i <= daysInMo; i++) {
      if (diffTimestamp(currTime, endTime, false) < 0) break; // break if currTime > endTime

      if (i === daysInMo && daysInMo < 31 && monthly.lastDayOfMonth === 1) {
        for (let j = i; j <= 31; j++) {
          if (monthly.daysOfMonth[j - 1] === '1') { // daysOfMonth is 0 based
            lastDayOfMonthSet = true;
            break
          }
        }
      }

      if (monthly.daysOfMonth[i - 1] === '1' || lastDayOfMonthSet) {
        eventStartTimes.push(currTime);
        eventEndTimes.push(addToDate(currTime, {minute: monthly.eventDurationMin}));
        notifTimes.push(addToDate(currTime, {minute: monthly.notifOffsetTimeMin}));
      }
      currTime = addToDate(currTime, {day: 1});
    }
  }

  const overridesMap = getOverridesMap(monthly.itemID);
  const generatedRems: GeneratedReminder[] = [];
  if (overridesMap !== undefined) {
    for (const override of overridesMap.values()) {
      // assume overrides only set event start time within the series start and end times
      if (override.eventStartYear === year) generatedRems.push(getGeneratedRemFromOverride(3, monthly, override)); // only generate for overrides that fall within the year window
    }
  }

  for (let i = 0; i < eventStartTimes.length; i++) {
    if (overridesMap !== undefined) {
      const {year: origEventStartYear, day: origEventStartDay, min: origEventStartMin} = getYearDayMin(eventStartTimes[i]!);
      const origStartTime: OrigStartTime = { origEventStartYear, origEventStartDay, origEventStartMin };
      if (overridesMap.get(origStartTime) !== undefined) continue;
    }
    generatedRems.push(getGeneratedRem(3, monthly, eventStartTimes[i]!, eventEndTimes[i]!, notifTimes[i]!));
  }

  return generatedRems;
}

export function generateYearly(yearly: YearlyReminder, year: number) {
  const rangeWindow = yearToRangeWindow(year);

  const {startTime, endTime} = getGenWindow(yearly, rangeWindow);
  let currTime = copyTimestamp(startTime);

  if (denormalizeDayOfYear(currTime.year, yearly.dayOfYear) < getDayOfYear(currTime)) currTime = addToDate(currTime, {year: 1}); // incr year if reminder is already passed
  currTime = parseDate(new Date(currTime.year, 0, denormalizeDayOfYear(currTime.year, yearly.dayOfYear)))!;
  currTime = updateMinutes(currTime, yearly.timeOfDayMin); // add timeOfDayMin

  const eventStartTimes: Timestamp[] = [];
  const eventEndTimes: Timestamp[] = [];
  const notifTimes: Timestamp[] = [];
  while (diffTimestamp(currTime, endTime, false) >= 0) { // while currTime <= endTime
    eventStartTimes.push(currTime);
    eventEndTimes.push(addToDate(currTime, {minute: yearly.eventDurationMin}));
    notifTimes.push(addToDate(currTime, {minute: yearly.notifOffsetTimeMin}));

    currTime = addToDate(currTime, {year: 1});
    currTime = parseDate(new Date(currTime.year, 0, denormalizeDayOfYear(currTime.year, yearly.dayOfYear)))!;
    currTime = updateMinutes(currTime, yearly.timeOfDayMin); // add timeOfDayMin
  }

  const overridesMap = getOverridesMap(yearly.itemID);
  const generatedRems: GeneratedReminder[] = [];
  if (overridesMap !== undefined) {
    for (const override of overridesMap.values()) {
      // assume overrides only set event start time within the series start and end times
      if (override.eventStartYear === year) generatedRems.push(getGeneratedRemFromOverride(4, yearly, override)); // only generate for overrides that fall within the year window
    }
  }

  for (let i = 0; i < eventStartTimes.length; i++) {
    if (overridesMap !== undefined) {
      const {year: origEventStartYear, day: origEventStartDay, min: origEventStartMin} = getYearDayMin(eventStartTimes[i]!);
      const origStartTime: OrigStartTime = { origEventStartYear, origEventStartDay, origEventStartMin };
      if (overridesMap.get(origStartTime) !== undefined) continue;
    }
    generatedRems.push(getGeneratedRem(4, yearly, eventStartTimes[i]!, eventEndTimes[i]!, notifTimes[i]!));
  }

  return generatedRems;
}


// helpers
function getGenWindow(recurring: DailyReminder | WeeklyReminder | MonthlyReminder | YearlyReminder, rangeWindow: RangeWindow) {
  const seriesStartTime = parseDate(new Date(recurring.seriesStartYear, 0, recurring.seriesStartDay, 0, 0))!;
  const seriesEndTime = parseDate(new Date(recurring.seriesEndYear, 0, recurring.seriesEndDay, 23, 59))!;
  const windowStartTime = parseDate(new Date(rangeWindow.startYear, 0, 1, 0, rangeWindow.startMinOfYear))!;
  const windowEndTime = parseDate(new Date(rangeWindow.endYear, 0, 1, 0, rangeWindow.endMinOfYear))!;

  const startTime = (diffTimestamp(seriesStartTime, windowStartTime, false) < 0) ? seriesStartTime : windowStartTime; // if seriesStart > windowStart take seriesStart
  const endTime = (diffTimestamp(seriesEndTime, windowEndTime, false) < 0) ? windowEndTime : seriesEndTime; // if seriesEnd > windowEnd take windowEnd

  return {startTime, endTime}
}

function getGeneratedRem(recurrenceTable: number, recurring: DailyReminder | WeeklyReminder | MonthlyReminder | YearlyReminder,
                         eventStartTime: Timestamp, eventEndTime: Timestamp, notifTime: Timestamp) {
  const {year: eventStartYear, day: eventStartDay, min: eventStartMin} = getYearDayMin(eventStartTime);
  const {year: eventEndYear, day: eventEndDay, min: eventEndMin} = getYearDayMin(eventEndTime);
  const {year: notifYear, day: notifDay, min: notifMin} = getYearDayMin(notifTime);

  const generatedRem : GeneratedReminder = {
    itemID: recurring.itemID,
    folderID: recurring.folderID,
    eventType: recurring.eventType,
    recurrenceTable : recurrenceTable,
    origEventStartYear: eventStartYear,
    origEventStartDay: eventStartDay,
    origEventStartMin: eventStartMin,
    eventStartYear: eventStartYear,
    eventStartDay: eventStartDay,
    eventStartMin: eventStartMin,
    eventEndYear: eventEndYear,
    eventEndDay: eventEndDay,
    eventEndMin: eventEndMin,
    notifYear: notifYear,
    notifDay: notifDay,
    notifMin: notifMin,
    isExtended: recurring.isExtended,
    hasNotif: recurring.hasNotifs,
    title : recurring.title
  }
  return generatedRem;
}

function getGeneratedRemFromOverride(recurrenceTable: number, recurring: DailyReminder | WeeklyReminder | MonthlyReminder | YearlyReminder, override: Override) {
  const generatedRem : GeneratedReminder = {
    itemID: recurring.itemID,
    folderID: recurring.folderID,
    eventType: recurring.eventType,
    recurrenceTable : recurrenceTable,
    origEventStartYear: override.origEventStartYear,
    origEventStartDay: override.origEventStartDay,
    origEventStartMin: override.origEventStartMin,
    eventStartYear: override.eventStartYear,
    eventStartDay: override.eventStartDay,
    eventStartMin: override.eventStartMin,
    eventEndYear: override.eventEndYear,
    eventEndDay: override.eventEndDay,
    eventEndMin: override.eventEndMin,
    notifYear: override.notifYear,
    notifDay: override.notifDay,
    notifMin: override.notifMin,
    isExtended: recurring.isExtended,
    hasNotif: override.hasNotif,
    title : recurring.title
  }
  return generatedRem;
}

function denormalizeDayOfYear(year: number, dayOfYear: number) {
  let dayOfYearDenormalized = dayOfYear;
  if (isLeapYear(year))
  {
    if (dayOfYear === 366) dayOfYearDenormalized = 60; // set to 60 if dayOfYear is 366 on leap year
    else if (dayOfYearDenormalized >= 60) dayOfYearDenormalized += 1;
  }
  else if (dayOfYear === 366) dayOfYearDenormalized = 59; // set to 59 if dayOfYear is 366 on NON leap year
  return dayOfYearDenormalized;
}

function yearToRangeWindow(year: number) {
  let endMinOfYear = 525599;
  if (isLeapYear(year)) endMinOfYear = 527039
  return {
    startYear: year,
    startMinOfYear: 0,
    endYear: year,
    endMinOfYear: endMinOfYear
  } as RangeWindow;
}

function getOverridesMap(linkedItemID: bigint) {
  const overrides = db.readOverrides(linkedItemID);
  if (overrides === undefined) return undefined;

  const overridesMap = new Map<OrigStartTime, Override>();
  for (const override of overrides) {
    const origStartTime: OrigStartTime = {
      origEventStartYear: override.origEventStartYear,
      origEventStartDay: override.origEventStartDay,
      origEventStartMin: override.origEventStartMin
    }
    overridesMap.set(origStartTime, override)
  }
  return overridesMap;
}

function getYearDayMin(timestamp: Timestamp) {
  return {
    year: timestamp.year,
    day: getDayOfYear(timestamp),
    min: (timestamp.hour * 60) + timestamp.minute
  }
}

interface OrigStartTime {
  origEventStartYear: number,
  origEventStartDay: number,
  origEventStartMin: number
}
