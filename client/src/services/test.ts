/*
 * Authors: Michael Jagiello
 * Created: 2025-11-04
 * Updated: 2025-11-19
 *
 * This file defines the entry testing suite function and the function used to test the Renderer.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import { convertTimeAndDateToTimestamp } from "src/frontend-utils/time";
import * as validate from "../utils/validate"
import * as eventtypes from "../utils/eventtypes"
import * as ldb from "../utils/local-db"
import type { GeneratedReminder } from "app/src-electron/types/shared-types";

export async function TestingSuite() {
  await TestingSuiteRenderer();
}

async function TestingSuiteRenderer() {
  await sleep(1000); // ensures all handlers assigned and everything else initialized
  Test_ValidateUsername();
  Test_ValidatePassword();
  Test_Flight();
  Test_Hotel();
  await Test_Notes();
  await Test_Reminders();
  await Test_Daily();
  await Test_Weekly();
  await Test_Monthly();
  await Test_Yearly();
  await Test_GeneratedBasic();

  await ldb.clearAllTables();
  await ldb.createRootFolder(0);
  let successes = 0;
  for (const b of results) {
    if (b) successes++;
  }
  console.log("Passed", successes, "of", results.length, "checks in the renderer.");
}

const results: boolean[] = [];

function Test(expected: boolean, result: string | boolean, prefix?: string) {
  if (prefix == undefined) prefix = "";
  if (typeof result === "string") {
    if (result == "") {
      results.push(expected);
    }
    else {
      console.log(prefix + result);
      results.push(!expected);
    }
  }
  else if (typeof result === "boolean") {
    results.push(expected == result);
    if (expected != result) console.log(prefix);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// test cases

function Test_ValidateUsername() {
  const errPrefix = "Test_ValidateUsername: ";
  let username = "";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "u";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "usernam";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "username";
  Test(true, validate.ValidateUsername(username), errPrefix);
  username = "usernameusernameusernameusername";
  Test(true, validate.ValidateUsername(username), errPrefix);
  username = "usernameusernameusernameusername1";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "username ";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "use name";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "user'ame";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "usern\"me";
  Test(false, validate.ValidateUsername(username), errPrefix);
  username = "userna\0e";
  Test(false, validate.ValidateUsername(username), errPrefix);
}

function Test_ValidatePassword() {
  const errPrefix = "Test_ValidatePassword: ";
  let password = "";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "p";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "passwor";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "password";
  Test(true, validate.ValidatePassword(password), errPrefix);
  password = "passwordpasswordpasswordpassword";
  Test(true, validate.ValidatePassword(password), errPrefix);
  password = "passwordpasswordpasswordpassword1";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "password ";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "pas word";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "pass'ord";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "passw\"rd";
  Test(false, validate.ValidatePassword(password), errPrefix);
  password = "passwo\0d";
  Test(false, validate.ValidatePassword(password), errPrefix);
}

function Test_Flight() {
  const depAirportName = "departure airport name";
  const depAirportAddress = "departure airport address";
  const arrAirportName = "arrival airport name";
  const arrAirportAddress = "arrival airport address";
  const airlineCode = "air code";
  const flightNumber = "flight #";
  const airlineName = "airliner";
  const depAirportIATA = "ABC";
  const depTimezoneAbbr = "ABCDE";
  const depTime = convertTimeAndDateToTimestamp("1999-12-31", "23:59");
  const depTimeDestZone = convertTimeAndDateToTimestamp("2000-12-31", "00:00");
  const boardingTime = convertTimeAndDateToTimestamp("1900-07-07", "07:00");
  const boardingGroup = "12";
  const gate = "A12";
  const depTimezoneOffset = "\x08";
  const arrTimezoneOffset = "\xF8";
  const arrAirportIATA = "CBA";
  const arrTimezoneAbbr = "EDCBA";
  const arrTime = convertTimeAndDateToTimestamp("2050-04-30", "06:59");
  const arrTimeDestZone = convertTimeAndDateToTimestamp("2100-12-31", "12:01");
  let flight = eventtypes.FieldsToFlight(depAirportName, depAirportAddress, arrAirportName, arrAirportAddress,
    airlineCode, flightNumber, airlineName, depAirportIATA, depTimezoneAbbr, depTime, depTimeDestZone, boardingTime, boardingGroup, gate,
    depTimezoneOffset, arrTimezoneOffset, arrAirportIATA, arrTimezoneAbbr, arrTime, arrTimeDestZone);
  Test(true, flight != undefined, "flight is undefined");
  if (flight == undefined) flight = eventtypes.FieldsToFlight();
  flight = flight!;
  const expectedYear1 = 1999, expectedDay1 = 365, expectedMin1 = 1439;
  const expectedYear2 = 2000, expectedDay2 = 366, expectedMin2 = 0;
  const expectedYear3 = 1900, expectedDay3 = 188, expectedMin3 = 420;
  const expectedYear4 = 2050, expectedDay4 = 120, expectedMin4 = 419;
  const expectedYear5 = 2100, expectedDay5 = 365, expectedMin5 = 721;
  Test(true, validate.MatchStrings(depAirportName, flight.depAirportName, "depAirportName"));
  Test(true, validate.MatchStrings(depAirportAddress, flight.depAirportAddress, "depAirportAddress"));
  Test(true, validate.MatchStrings(arrAirportName, flight.arrAirportName, "arrAirportName"));
  Test(true, validate.MatchStrings(arrAirportAddress, flight.arrAirportAddress, "arrAirportAddress"));
  Test(true, validate.MatchStrings(airlineCode, flight.airlineCode, "airlineCode"));
  Test(true, validate.MatchStrings(flightNumber, flight.flightNumber, "flightNumber"));
  Test(true, validate.MatchStrings(airlineName, flight.airlineName, "airlineName"));
  Test(true, validate.MatchStrings(depAirportIATA, flight.depAirportIATA, "depAirportIATA"));
  Test(true, validate.MatchStrings(depTimezoneAbbr, flight.depTimezoneAbbr, "depTimezoneAbbr"));
  Test(true, flight.depTimeYear == expectedYear1, "depTimeYear does not match");
  Test(true, flight.depTimeDay == expectedDay1, "depTimeDay does not match");
  Test(true, flight.depTimeMin == expectedMin1, "depTimeMin does not match");
  Test(true, flight.depTimeDestZoneYear == expectedYear2, "depTimeDestZoneYear does not match");
  Test(true, flight.depTimeDestZoneDay == expectedDay2, "depTimeDestZoneDay does not match");
  Test(true, flight.depTimeDestZoneMin == expectedMin2, "depTimeDestZoneMin does not match");
  Test(true, flight.boardingTimeYear == expectedYear3, "boardingTimeYear does not match");
  Test(true, flight.boardingTimeDay == expectedDay3, "boardingTimeDay does not match");
  Test(true, flight.boardingTimeMin == expectedMin3, "boardingTimeMin does not match");
  Test(true, validate.MatchStrings(boardingGroup, flight.boardingGroup, "boardingGroup"));
  Test(true, validate.MatchStrings(gate, flight.gate, "gate"));
  Test(true, validate.MatchStrings(depTimezoneOffset, flight.depTimezoneOffset, "depTimezoneOffset"));
  Test(true, validate.MatchStrings(arrTimezoneOffset, flight.arrTimezoneOffset, "arrTimezoneOffset"));
  Test(true, validate.MatchStrings(arrAirportIATA, flight.arrAirportIATA, "arrAirportIATA"));
  Test(true, validate.MatchStrings(arrTimezoneAbbr, flight.arrTimezoneAbbr, "arrTimezoneAbbr"));
  Test(true, flight.arrTimeYear == expectedYear4, "arrTimeYear does not match");
  Test(true, flight.arrTimeDay == expectedDay4, "arrTimeDay does not match");
  Test(true, flight.arrTimeMin == expectedMin4, "arrTimeMin does not match");
  Test(true, flight.arrTimeDestZoneYear == expectedYear5, "arrTimeDestZoneYear does not match");
  Test(true, flight.arrTimeDestZoneDay == expectedDay5, "arrTimeDestZoneDay does not match");
  Test(true, flight.arrTimeDestZoneMin == expectedMin5, "arrTimeDestZoneMin does not match");

  let extensions = eventtypes.FlightToExtensions(flight);
  Test(true, extensions != undefined && extensions.length == 6, "extensions is undefined or wrong length");
  if (extensions == undefined) extensions = [];
  Test(true, extensions[0]!.data.length == 64 && extensions[1]!.data.length == 64 && extensions[2]!.data.length == 64 && 
    extensions[3]!.data.length == 64 && extensions[4]!.data.length == 64 && extensions[5]!.data.length == 64, "one or more extensions have wrong data length");
  // skipping doing extensions checking

  let flightExt = eventtypes.ExtensionsToFlight(extensions);
  Test(true, flightExt != undefined, "flightExt is undefined");
  if (flightExt == undefined) flightExt = eventtypes.FieldsToFlight()!;
  Test(true, validate.MatchStrings(depAirportName, flightExt.depAirportName, "depAirportName"));
  Test(true, validate.MatchStrings(depAirportAddress, flightExt.depAirportAddress, "depAirportAddress"));
  Test(true, validate.MatchStrings(arrAirportName, flightExt.arrAirportName, "arrAirportName"));
  Test(true, validate.MatchStrings(arrAirportAddress, flightExt.arrAirportAddress, "arrAirportAddress"));
  Test(true, validate.MatchStrings(airlineCode, flightExt.airlineCode, "airlineCode"));
  Test(true, validate.MatchStrings(flightNumber, flightExt.flightNumber, "flightNumber"));
  Test(true, validate.MatchStrings(airlineName, flightExt.airlineName, "airlineName"));
  Test(true, validate.MatchStrings(depAirportIATA, flightExt.depAirportIATA, "depAirportIATA"));
  Test(true, validate.MatchStrings(depTimezoneAbbr, flightExt.depTimezoneAbbr, "depTimezoneAbbr"));
  Test(true, flightExt.depTimeYear == expectedYear1, "depTimeYear does not match");
  Test(true, flightExt.depTimeDay == expectedDay1, "depTimeDay does not match");
  Test(true, flightExt.depTimeMin == expectedMin1, "depTimeMin does not match");
  Test(true, flightExt.depTimeDestZoneYear == expectedYear2, "depTimeDestZoneYear does not match");
  Test(true, flightExt.depTimeDestZoneDay == expectedDay2, "depTimeDestZoneDay does not match");
  Test(true, flightExt.depTimeDestZoneMin == expectedMin2, "depTimeDestZoneMin does not match");
  Test(true, flightExt.boardingTimeYear == expectedYear3, "boardingTimeYear does not match");
  Test(true, flightExt.boardingTimeDay == expectedDay3, "boardingTimeDay does not match");
  Test(true, flightExt.boardingTimeMin == expectedMin3, "boardingTimeMin does not match");
  Test(true, validate.MatchStrings(boardingGroup, flightExt.boardingGroup, "boardingGroup"));
  Test(true, validate.MatchStrings(gate, flightExt.gate, "gate"));
  Test(true, validate.MatchStrings(depTimezoneOffset, flightExt.depTimezoneOffset, "depTimezoneOffset"));
  Test(true, validate.MatchStrings(arrTimezoneOffset, flightExt.arrTimezoneOffset, "arrTimezoneOffset"));
  Test(true, validate.MatchStrings(arrAirportIATA, flightExt.arrAirportIATA, "arrAirportIATA"));
  Test(true, validate.MatchStrings(arrTimezoneAbbr, flightExt.arrTimezoneAbbr, "arrTimezoneAbbr"));
  Test(true, flightExt.arrTimeYear == expectedYear4, "arrTimeYear does not match");
  Test(true, flightExt.arrTimeDay == expectedDay4, "arrTimeDay does not match");
  Test(true, flightExt.arrTimeMin == expectedMin4, "arrTimeMin does not match");
  Test(true, flightExt.arrTimeDestZoneYear == expectedYear5, "arrTimeDestZoneYear does not match");
  Test(true, flightExt.arrTimeDestZoneDay == expectedDay5, "arrTimeDestZoneDay does not match");
  Test(true, flightExt.arrTimeDestZoneMin == expectedMin5, "arrTimeDestZoneMin does not match");
}

function Test_Hotel() {
  const hotelName = "hotel name";
  const hotelAddress = "hotel address";
  const checkinTime = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const checkoutTime = convertTimeAndDateToTimestamp("2002-07-01", "14:08");
  const timezoneAbbrev = "ET";
  const timezoneOffset = "\x04";
  const roomNumber = "216";
  let hotel = eventtypes.FieldsToHotel(hotelName, hotelAddress, checkinTime, checkoutTime, timezoneAbbrev, timezoneOffset, roomNumber);
  Test(true, hotel != undefined, "hotel is undefined");
  if (hotel == undefined) hotel = eventtypes.FieldsToHotel();
  hotel = hotel!;
  const expectedYear1 = 2001, expectedDay1 = 1, expectedMin1 = 0;
  const expectedYear2 = 2002, expectedDay2 = 182, expectedMin2 = 848;
  Test(true, validate.MatchStrings(hotelName, hotel.name, "hotelName"));
  Test(true, validate.MatchStrings(hotelAddress, hotel.address, "hotelAddress"));
  Test(true, hotel.checkinTimeYear == expectedYear1, "checkinTimeYear does not match");
  Test(true, hotel.checkinTimeDay == expectedDay1, "checkinTimeDay does not match");
  Test(true, hotel.checkinTimeMin == expectedMin1, "checkinTimeMin does not match");
  Test(true, hotel.checkoutTimeYear == expectedYear2, "checkoutTimeYear does not match");
  Test(true, hotel.checkoutTimeDay == expectedDay2, "checkoutTimeDay does not match");
  Test(true, hotel.checkoutTimeMin == expectedMin2, "checkoutTimeMin does not match");
  Test(true, validate.MatchStrings(timezoneAbbrev, hotel.timezoneAbbrev, "timezoneAbbrev"));
  Test(true, validate.MatchStrings(timezoneOffset, hotel.timezoneOffset, "timezoneOffset"));
  Test(true, validate.MatchStrings(roomNumber, hotel.roomNumber, "roomNumber"));

  let extensions = eventtypes.HotelToExtensions(hotel);
  Test(true, extensions != undefined && extensions.length == 4, "extensions is undefined or wrong length");
  if (extensions == undefined) extensions = [];
  Test(true, extensions[0]!.data.length == 64 && extensions[1]!.data.length == 64 && extensions[2]!.data.length == 64 && extensions[3]!.data.length == 64, "one or more extensions have wrong data length");
  const expectedYear1Str = "\xD1\x07\x00\x00", expectedDay1Str = "\x01\x00", expectedMin1Str = "\x00\x00";
  const expectedYear2Str = "\xD2\x07\x00\x00", expectedDay2Str = "\xB6\x00", expectedMin2Str = "\x50\x03";
  Test(true, validate.MatchStrings(validate.PadString(hotelName, 64), extensions[0]!.data, "hotelName"));
  Test(true, validate.MatchStrings(validate.PadString(hotelAddress, 128).substring(0, 64), extensions[1]!.data, "hotelAddress"));
  Test(true, validate.MatchStrings(validate.PadString(hotelAddress, 128).substring(64, 128), extensions[2]!.data, "hotelAddress"));
  Test(true, validate.MatchStrings(extensions[3]!.data.substring(0, 4), expectedYear1Str, "checkinTimeYear"));
  Test(true, validate.MatchStrings(extensions[3]!.data.substring(4, 6), expectedDay1Str, "checkinTimeDay"));
  Test(true, validate.MatchStrings(extensions[3]!.data.substring(6, 8), expectedMin1Str, "checkinTimeMin"));
  Test(true, validate.MatchStrings(extensions[3]!.data.substring(8, 12), expectedYear2Str, "checkoutTimeYear"));
  Test(true, validate.MatchStrings(extensions[3]!.data.substring(12, 14), expectedDay2Str, "checkoutTimeDay"));
  Test(true, validate.MatchStrings(extensions[3]!.data.substring(14, 16), expectedMin2Str, "checkoutTimeMin"));
  Test(true, validate.MatchStrings(validate.PadString(timezoneAbbrev, 5), extensions[3]!.data.substring(16, 21), "timezoneAbbrev"));
  Test(true, validate.MatchStrings(validate.PadString(timezoneOffset, 1), extensions[3]!.data.substring(21, 22), "timezoneOffset"));
  Test(true, validate.MatchStrings(validate.PadString(roomNumber, 10), extensions[3]!.data.substring(22, 32), "roomNumber"));

  let hotelExt = eventtypes.ExtensionsToHotel(extensions);
  Test(true, hotelExt != undefined, "hotelExt is undefined");
  if (hotelExt == undefined) hotelExt = eventtypes.FieldsToHotel()!;
  Test(true, validate.MatchStrings(hotelName, hotelExt.name, "hotelName"));
  Test(true, validate.MatchStrings(hotelAddress, hotelExt.address, "hotelAddress"));
  Test(true, hotelExt.checkinTimeYear == expectedYear1, "checkinTimeYear does not match");
  Test(true, hotelExt.checkinTimeDay == expectedDay1, "checkinTimeDay does not match");
  Test(true, hotelExt.checkinTimeMin == expectedMin1, "checkinTimeMin does not match");
  Test(true, hotelExt.checkoutTimeYear == expectedYear2, "checkoutTimeYear does not match");
  Test(true, hotelExt.checkoutTimeDay == expectedDay2, "checkoutTimeDay does not match");
  Test(true, hotelExt.checkoutTimeMin == expectedMin2, "checkoutTimeMin does not match");
  Test(true, validate.MatchStrings(timezoneAbbrev, hotelExt.timezoneAbbrev, "timezoneAbbrev"));
  Test(true, validate.MatchStrings(timezoneOffset, hotelExt.timezoneOffset, "timezoneOffset"));
  Test(true, validate.MatchStrings(roomNumber, hotelExt.roomNumber, "roomNumber"));
}

async function Test_Notes() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const note1ID = await ldb.createNote(0n, "note1", "contents1");
  const note1 = await ldb.readNote(note1ID);
  Test(true, note1.folderID == 0n, "note1 folder ID must match");
  Test(true, note1.title == "note1", "note1 title must match");
  Test(true, note1.text == "contents1", "note1 text must match");
  Test(true, note1.extensions!.length == 0, "note1 extensions must be 0 in length");

  await sleep(5);
  const note2ID = await ldb.createNote(0n, "note2", "contentscontentscontentscontentscontentscontentscontentscontents2");
  const note2 = await ldb.readNote(note2ID);
  Test(true, note2.folderID == 0n, "note2 folder ID must match");
  Test(true, note2.title == "note2", "note2 title must match");
  Test(true, note2.text == "contentscontentscontentscontentscontentscontentscontentscontents2", "note2 text must match"); // extension data is reapplied to text field
  Test(true, note2.extensions!.length == 1 && note2.extensions![0]!.data == "2", "note2 extensions must be undefined");
}

async function Test_Reminders() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp1 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp1 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const reminder1ID = await ldb.createReminder(0n, 0, startStamp1, endStamp1, startStamp1, true, "rem1");
  const reminder1 = await ldb.readReminder(reminder1ID);
  Test(true, reminder1.eventStartYear == 2001 && reminder1.eventStartDay == 1 && reminder1.eventStartMin == 0, "reminder1 event start time must match");
  Test(true, reminder1.eventEndYear == 2001 && reminder1.eventEndDay == 365 && reminder1.eventEndMin == 1439, "reminder1 event end time must match");
  Test(true, reminder1.notifYear == 2001 && reminder1.notifDay == 1 && reminder1.notifMin == 0, "reminder1 notif time must match");
  Test(true, reminder1.hasNotif == 1, "reminder1 must have notif");
  Test(true, reminder1.title == "rem1", "reminder1 title must match");

  await sleep(5);
  const startStamp2 = convertTimeAndDateToTimestamp("2004-01-02", "01:00");
  const endStamp2 = convertTimeAndDateToTimestamp("2004-12-30", "22:59");
  const reminder2ID = await ldb.createReminder(0n, 0, startStamp2, endStamp2, startStamp2, false, "rem2");
  const reminder2 = await ldb.readReminder(reminder2ID);
  Test(true, reminder2.eventStartYear == 2004 && reminder2.eventStartDay == 2 && reminder2.eventStartMin == 60, "reminder2 event start time must match");
  Test(true, reminder2.eventEndYear == 2004 && reminder2.eventEndDay == 365 && reminder2.eventEndMin == 1379, "reminder2 event end time must match");
  Test(true, reminder2.notifYear == 2004 && reminder2.notifDay == 2 && reminder2.notifMin == 60, "reminder2 notif time must match");
  Test(true, reminder2.hasNotif == 0, "reminder2 must have notif");
  Test(true, reminder2.title == "rem2", "reminder2 title must match");
}

async function Test_Daily() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp1 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp1 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const timeOfDayMin1 = 10, eventDurationMin1 = 10, notifOffsetTimeMin1 = -1, hasNotifs1 = true;
  const everyNDays1 = 1;
  const daily1ID = await ldb.createDailyReminder(0n, 0, startStamp1, endStamp1, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, everyNDays1, "daily1");
  const daily1 = await ldb.readDailyReminder(daily1ID);
  Test(true, daily1.seriesStartYear == 2001 && daily1.seriesStartDay == 1 && daily1.seriesStartMin == 0, "daily1 series start time must match");
  Test(true, daily1.seriesEndYear == 2001 && daily1.seriesEndDay == 365 && daily1.seriesEndMin == 1439, "daily1 series end time must match");
  Test(true, daily1.timeOfDayMin == timeOfDayMin1, "daily1 time of day must match");
  Test(true, daily1.eventDurationMin == eventDurationMin1, "daily1 event duration must match");
  Test(true, daily1.notifOffsetTimeMin == notifOffsetTimeMin1, "daily1 notif offset time must match");
  Test(true, daily1.hasNotifs == Number(hasNotifs1), "daily1 has notifs must match");
  Test(true, daily1.everyNDays == everyNDays1, "daily1 every n days must match");

  await sleep(5);
  const startStamp2 = convertTimeAndDateToTimestamp("2004-01-02", "01:00");
  const endStamp2 = convertTimeAndDateToTimestamp("2004-12-30", "22:59");
  const timeOfDayMin2 = 600, eventDurationMin2 = 1, notifOffsetTimeMin2 = -10, hasNotifs2 = false;
  const everyNDays2 = 1;
  const daily2ID = await ldb.createDailyReminder(0n, 0, startStamp2, endStamp2, timeOfDayMin2, eventDurationMin2, notifOffsetTimeMin2, hasNotifs2, everyNDays2, "daily2");
  const daily2 = await ldb.readDailyReminder(daily2ID);
  Test(true, daily2.seriesStartYear == 2004 && daily2.seriesStartDay == 2 && daily2.seriesStartMin == 60, "daily2 series start time must match");
  Test(true, daily2.seriesEndYear == 2004 && daily2.seriesEndDay == 365 && daily2.seriesEndMin == 1379, "daily2 series end time must match");
  Test(true, daily2.timeOfDayMin == timeOfDayMin2, "daily2 time of day must match");
  Test(true, daily2.eventDurationMin == eventDurationMin2, "daily2 event duration must match");
  Test(true, daily2.notifOffsetTimeMin == notifOffsetTimeMin2, "daily2 notif offset time must match");
  Test(true, daily2.hasNotifs == Number(hasNotifs2), "daily2 has notifs must match");
  Test(true, daily2.everyNDays == everyNDays2, "daily2 every n days must match");
}

async function Test_Weekly() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp1 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp1 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const timeOfDayMin1 = 10, eventDurationMin1 = 10, notifOffsetTimeMin1 = -1, hasNotifs1 = true;
  const everyNWeeks1 = 1, daysOfWeek1 = "1110111";
  const weekly1ID = await ldb.createWeeklyReminder(0n, 0, startStamp1, endStamp1, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, everyNWeeks1, daysOfWeek1, "weekly1");
  const weekly1 = await ldb.readWeeklyReminder(weekly1ID);
  Test(true, weekly1.seriesStartYear == 2001 && weekly1.seriesStartDay == 1 && weekly1.seriesStartMin == 0, "weekly1 series start time must match");
  Test(true, weekly1.seriesEndYear == 2001 && weekly1.seriesEndDay == 365 && weekly1.seriesEndMin == 1439, "weekly1 series end time must match");
  Test(true, weekly1.timeOfDayMin == timeOfDayMin1, "weekly1 time of day must match");
  Test(true, weekly1.eventDurationMin == eventDurationMin1, "weekly1 event duration must match");
  Test(true, weekly1.notifOffsetTimeMin == notifOffsetTimeMin1, "weekly1 notif offset time must match");
  Test(true, weekly1.hasNotifs == Number(hasNotifs1), "weekly1 has notifs must match");
  Test(true, weekly1.everyNWeeks == everyNWeeks1, "weekly1 every n weeks must match");
  Test(true, weekly1.daysOfWeek == daysOfWeek1, "weekly1 days of week must match");

  await sleep(5);
  const startStamp2 = convertTimeAndDateToTimestamp("2004-01-02", "01:00");
  const endStamp2 = convertTimeAndDateToTimestamp("2004-12-30", "22:59");
  const timeOfDayMin2 = 600, eventDurationMin2 = 1, notifOffsetTimeMin2 = -10, hasNotifs2 = false;
  const everyNWeeks2 = 1, daysOfWeek2 = "0001000";
  const weekly2ID = await ldb.createWeeklyReminder(0n, 0, startStamp2, endStamp2, timeOfDayMin2, eventDurationMin2, notifOffsetTimeMin2, hasNotifs2, everyNWeeks2, daysOfWeek2, "weekly2");
  const weekly2 = await ldb.readWeeklyReminder(weekly2ID);
  Test(true, weekly2.seriesStartYear == 2004 && weekly2.seriesStartDay == 2 && weekly2.seriesStartMin == 60, "weekly2 series start time must match");
  Test(true, weekly2.seriesEndYear == 2004 && weekly2.seriesEndDay == 365 && weekly2.seriesEndMin == 1379, "weekly2 series end time must match");
  Test(true, weekly2.timeOfDayMin == timeOfDayMin2, "weekly2 time of day must match");
  Test(true, weekly2.eventDurationMin == eventDurationMin2, "weekly2 event duration must match");
  Test(true, weekly2.notifOffsetTimeMin == notifOffsetTimeMin2, "weekly2 notif offset time must match");
  Test(true, weekly2.hasNotifs == Number(hasNotifs2), "weekly2 has notifs must match");
  Test(true, weekly2.everyNWeeks == everyNWeeks2, "weekly2 every n weeks must match");
  Test(true, weekly2.daysOfWeek == daysOfWeek2, "weekly2 days of week must match");
}

async function Test_Monthly() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp1 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp1 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const timeOfDayMin1 = 10, eventDurationMin1 = 10, notifOffsetTimeMin1 = -1, hasNotifs1 = true;
  const lastDayOfMonth1 = false, daysOfMonth1 = "1111000000000000000000000000000";
  const monthly1ID = await ldb.createMonthlyReminder(0n, 0, startStamp1, endStamp1, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, lastDayOfMonth1, daysOfMonth1, "monthly1");
  const monthly1 = await ldb.readMonthlyReminder(monthly1ID);
  Test(true, monthly1.seriesStartYear == 2001 && monthly1.seriesStartDay == 1 && monthly1.seriesStartMin == 0, "monthly1 series start time must match");
  Test(true, monthly1.seriesEndYear == 2001 && monthly1.seriesEndDay == 365 && monthly1.seriesEndMin == 1439, "monthly1 series end time must match");
  Test(true, monthly1.timeOfDayMin == timeOfDayMin1, "monthly1 time of day must match");
  Test(true, monthly1.eventDurationMin == eventDurationMin1, "monthly1 event duration must match");
  Test(true, monthly1.notifOffsetTimeMin == notifOffsetTimeMin1, "monthly1 notif offset time must match");
  Test(true, monthly1.hasNotifs == Number(hasNotifs1), "monthly1 has notifs must match");
  Test(true, monthly1.lastDayOfMonth == Number(lastDayOfMonth1), "monthly1 last day of month must match");
  Test(true, monthly1.daysOfMonth == daysOfMonth1, "monthly1 days of month must match");

  await sleep(5);
  const startStamp2 = convertTimeAndDateToTimestamp("2004-01-02", "01:00");
  const endStamp2 = convertTimeAndDateToTimestamp("2004-12-30", "22:59");
  const timeOfDayMin2 = 600, eventDurationMin2 = 1, notifOffsetTimeMin2 = -10, hasNotifs2 = false;
  const lastDayOfMonth2 = false, daysOfMonth2 = "0000000000000000000000000001111";
  const monthly2ID = await ldb.createMonthlyReminder(0n, 0, startStamp2, endStamp2, timeOfDayMin2, eventDurationMin2, notifOffsetTimeMin2, hasNotifs2, lastDayOfMonth2, daysOfMonth2, "monthly2");
  const monthly2 = await ldb.readMonthlyReminder(monthly2ID);
  Test(true, monthly2.seriesStartYear == 2004 && monthly2.seriesStartDay == 2 && monthly2.seriesStartMin == 60, "monthly2 series start time must match");
  Test(true, monthly2.seriesEndYear == 2004 && monthly2.seriesEndDay == 365 && monthly2.seriesEndMin == 1379, "monthly2 series end time must match");
  Test(true, monthly2.timeOfDayMin == timeOfDayMin2, "monthly2 time of day must match");
  Test(true, monthly2.eventDurationMin == eventDurationMin2, "monthly2 event duration must match");
  Test(true, monthly2.notifOffsetTimeMin == notifOffsetTimeMin2, "monthly2 notif offset time must match");
  Test(true, monthly2.hasNotifs == Number(hasNotifs2), "monthly2 has notifs must match");
  Test(true, monthly2.lastDayOfMonth == Number(lastDayOfMonth2), "monthly2 last day of month must match");
  Test(true, monthly2.daysOfMonth == daysOfMonth2, "monthly2 days of month must match");
}

async function Test_Yearly() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp1 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp1 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const timeOfDayMin1 = 10, eventDurationMin1 = 10, notifOffsetTimeMin1 = -1, hasNotifs1 = true;
  const yearly1ID = await ldb.createYearlyReminder(0n, 0, startStamp1, endStamp1, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, startStamp1, "yearly1");
  const yearly1 = await ldb.readYearlyReminder(yearly1ID);
  Test(true, yearly1.seriesStartYear == 2001 && yearly1.seriesStartDay == 1 && yearly1.seriesStartMin == 0, "yearly1 series start time must match");
  Test(true, yearly1.seriesEndYear == 2001 && yearly1.seriesEndDay == 365 && yearly1.seriesEndMin == 1439, "yearly1 series end time must match");
  Test(true, yearly1.timeOfDayMin == timeOfDayMin1, "yearly1 time of day must match");
  Test(true, yearly1.eventDurationMin == eventDurationMin1, "yearly1 event duration must match");
  Test(true, yearly1.notifOffsetTimeMin == notifOffsetTimeMin1, "yearly1 notif offset time must match");
  Test(true, yearly1.hasNotifs == Number(hasNotifs1), "yearly1 has notifs must match");
  Test(true, yearly1.dayOfYear == 1, "yearly1 day of year must match");

  await sleep(5);
  const startStamp2 = convertTimeAndDateToTimestamp("2004-01-02", "01:00");
  const endStamp2 = convertTimeAndDateToTimestamp("2004-12-30", "22:59");
  const timeOfDayMin2 = 600, eventDurationMin2 = 1, notifOffsetTimeMin2 = -10, hasNotifs2 = false;
  const yearly2ID = await ldb.createYearlyReminder(0n, 0, startStamp2, endStamp2, timeOfDayMin2, eventDurationMin2, notifOffsetTimeMin2, hasNotifs2, startStamp2, "yearly2");
  const yearly2 = await ldb.readYearlyReminder(yearly2ID);
  Test(true, yearly2.seriesStartYear == 2004 && yearly2.seriesStartDay == 2 && yearly2.seriesStartMin == 60, "yearly2 series start time must match");
  Test(true, yearly2.seriesEndYear == 2004 && yearly2.seriesEndDay == 365 && yearly2.seriesEndMin == 1379, "yearly2 series end time must match");
  Test(true, yearly2.timeOfDayMin == timeOfDayMin2, "yearly2 time of day must match");
  Test(true, yearly2.eventDurationMin == eventDurationMin2, "yearly2 event duration must match");
  Test(true, yearly2.notifOffsetTimeMin == notifOffsetTimeMin2, "yearly2 notif offset time must match");
  Test(true, yearly2.hasNotifs == Number(hasNotifs2), "yearly2 has notifs must match");
  Test(true, yearly2.dayOfYear == 2, "yearly2 day of year must match");
}

async function Test_GeneratedBasic() {
  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp1 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp1 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const timeOfDayMin1 = 10, eventDurationMin1 = 10, notifOffsetTimeMin1 = -1, hasNotifs1 = true;
  const everyNDays1 = 2;
  const daily1ID = await ldb.createDailyReminder(0n, 0, startStamp1, endStamp1, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, everyNDays1, "daily");
  const dailies = await ldb.readGeneratedRemindersInRange(startStamp1, endStamp1);
  Test(true, dailies.length == 183, "basic daily reminders test must have 183 results");
  Test(true, CheckGeneratedBasic(dailies));

  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp2 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp2 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const everyNWeeks2 = 1, daysOfWeek2 = "0001000";
  const weekly2ID = await ldb.createWeeklyReminder(0n, 0, startStamp2, endStamp2, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, everyNWeeks2, daysOfWeek2, "weekly");
  const weeklies = await ldb.readGeneratedRemindersInRange(startStamp2, endStamp2);
  Test(true, weeklies.length == 52, "basic weekly reminders test must have 52 results");
  Test(true, CheckGeneratedBasic(weeklies));

  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp3 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp3 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const lastDayOfMonth3 = false, daysOfMonth3 = "0100000000000000000000000010000";
  const monthly3ID = await ldb.createMonthlyReminder(0n, 0, startStamp3, endStamp3, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, lastDayOfMonth3, daysOfMonth3, "monthly");
  const monthlies = await ldb.readGeneratedRemindersInRange(startStamp3, endStamp3);
  Test(true, monthlies.length == 24, "basic monthly reminders test must have 24 results");
  Test(true, CheckGeneratedBasic(monthlies));

  await ldb.clearAllTables();
  await ldb.createRootFolder(0);

  const startStamp4 = convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  const endStamp4 = convertTimeAndDateToTimestamp("2001-12-31", "23:59");
  const yearly4ID = await ldb.createYearlyReminder(0n, 0, startStamp4, endStamp4, timeOfDayMin1, eventDurationMin1, notifOffsetTimeMin1, hasNotifs1, startStamp4, "yearly");
  const yearlies = await ldb.readGeneratedRemindersInRange(startStamp4, endStamp4);
  Test(true, yearlies.length == 1, "basic yearly reminders test must have 1 result");
  Test(true, CheckGeneratedBasic(yearlies));

  function CheckGeneratedBasic(generated: GeneratedReminder[]) {
    for (const reminder of generated) {
      if (reminder.eventStartMin != timeOfDayMin1) { console.log("generated reminders must match the event start minute"); return false; }
      if (reminder.eventEndMin != (timeOfDayMin1 + eventDurationMin1)) { console.log("generated reminders must match the event end minute"); return false; }
      if (reminder.notifMin != (timeOfDayMin1 + notifOffsetTimeMin1)) { console.log("generated reminders must match the notification minute"); return false; }
      if (!reminder.hasNotif) { console.log("generated reminders must match the has notification"); return false; }
    }
    return true;
  }
}
