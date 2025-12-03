/*
 * Authors: Michael Jagiello
 * Created: 2025-11-06
 * Updated: 2025-11-13
 *
 * This file defines functions for converting back and forth between extensions and eventTypes, as well as helpers to convert input fields into the eventTypes.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import { Buffer } from "buffer"
import { getDayOfYear, type Timestamp } from '@quasar/quasar-ui-qcalendar';
import { convertTimeAndDateToTimestamp } from 'src/frontend-utils/time';
import { PadString, UnpadString } from "./validate";
import type { Extension, Flight, Hotel,  } from "app/src-electron/types/shared-types";

// input fields to eventType

// converts input fields into a Flight object
// note that itemID and lastModified are set to 0 and must be updated later to store with item
// returns undefined if one of the input strings was too long
export function FieldsToFlight(depAirportName?: string, depAirportAddress?: string, arrAirportName?: string, arrAirportAddress?: string,
    airlineCode?: string, flightNumber?: string, airlineName?: string, depAirportIATA?: string, depTimezoneAbbr?: string, 
    depTime?: Timestamp, depTimeDestZone?: Timestamp, boardingTime?: Timestamp,
    boardingGroup?: string, gate?: string, depTimezoneOffset?: string, arrTimezoneOffset?: string, 
    arrAirportIATA?: string, arrTimezoneAbbr?: string, arrTime?: Timestamp, arrTimeDestZone?: Timestamp) {
  const flight: Flight = {
    itemID: 0n,
    lastModified: 0n,
    depAirportName: depAirportName != undefined ? depAirportName : "",
    depAirportAddress: depAirportAddress != undefined ? depAirportAddress : "",
    arrAirportName: arrAirportName != undefined ? arrAirportName : "",
    arrAirportAddress: arrAirportAddress != undefined ? arrAirportAddress : "",
    airlineCode: airlineCode != undefined ? airlineCode : "",
    flightNumber: flightNumber != undefined ? flightNumber : "",
    airlineName: airlineName != undefined ? airlineName : "",
    depAirportIATA: depAirportIATA != undefined ? depAirportIATA : "",
    depTimezoneAbbr: depTimezoneAbbr != undefined ? depTimezoneAbbr : "",
    depTimeYear: TimestampYear(ValidateTimestamp(depTime)),
    depTimeDay: TimestampDay(ValidateTimestamp(depTime)),
    depTimeMin: TimestampMin(ValidateTimestamp(depTime)),
    depTimeDestZoneYear: TimestampYear(ValidateTimestamp(depTimeDestZone)),
    depTimeDestZoneDay: TimestampDay(ValidateTimestamp(depTimeDestZone)),
    depTimeDestZoneMin: TimestampMin(ValidateTimestamp(depTimeDestZone)),
    boardingTimeYear: TimestampYear(ValidateTimestamp(boardingTime)),
    boardingTimeDay: TimestampDay(ValidateTimestamp(boardingTime)),
    boardingTimeMin: TimestampMin(ValidateTimestamp(boardingTime)),
    boardingGroup: boardingGroup != undefined ? boardingGroup : "",
    gate: gate != undefined ? gate : "",
    depTimezoneOffset: depTimezoneOffset != undefined ? depTimezoneOffset : "",
    arrTimezoneOffset: arrTimezoneOffset != undefined ? arrTimezoneOffset : "",
    arrAirportIATA: arrAirportIATA != undefined ? arrAirportIATA : "",
    arrTimezoneAbbr: arrTimezoneAbbr != undefined ? arrTimezoneAbbr : "",
    arrTimeYear: TimestampYear(ValidateTimestamp(arrTime)),
    arrTimeDay: TimestampDay(ValidateTimestamp(arrTime)),
    arrTimeMin: TimestampMin(ValidateTimestamp(arrTime)),
    arrTimeDestZoneYear: TimestampYear(ValidateTimestamp(arrTimeDestZone)),
    arrTimeDestZoneDay: TimestampDay(ValidateTimestamp(arrTimeDestZone)),
    arrTimeDestZoneMin: TimestampMin(ValidateTimestamp(arrTimeDestZone))
  };
  return flight;
}

// converts input fields into a Hotel object
// note that itemID and lastModified are set to 0 and must be updated later to store with item
// returns undefined if one of the input strings was too long
export function FieldsToHotel(name?: string, address?: string, 
    checkinTime?: Timestamp, checkoutTime?: Timestamp, 
    timezoneAbbrev?: string, timezoneOffset?: string, roomNumber?: string) {
  const hotel: Hotel = {
    itemID: 0n,
    lastModified: 0n,
    name: name != undefined ? name : "",
    address: address != undefined ? address : "",
    checkinTimeYear: TimestampYear(ValidateTimestamp(checkinTime)),
    checkinTimeDay: TimestampDay(ValidateTimestamp(checkinTime)),
    checkinTimeMin: TimestampMin(ValidateTimestamp(checkinTime)),
    checkoutTimeYear: TimestampYear(ValidateTimestamp(checkoutTime)),
    checkoutTimeDay: TimestampDay(ValidateTimestamp(checkoutTime)),
    checkoutTimeMin: TimestampMin(ValidateTimestamp(checkoutTime)),
    timezoneAbbrev: timezoneAbbrev != undefined ? timezoneAbbrev : "",
    timezoneOffset: timezoneOffset != undefined ? timezoneOffset : "",
    roomNumber: roomNumber != undefined ? roomNumber : ""
  };
  return hotel;
}

// eventType to Extensions

// takes a Flight and packs into 6 Extensions
// pads out fields to required length, but assumes they are not too long
export function FlightToExtensions(flight: Flight) {
  const extensions: Extension[] = [
    {
      itemID: flight.itemID,
      sequenceNum: 1,
      lastModified: flight.lastModified,
      data: PadString(flight.depAirportName, 64)
    },
    {
      itemID: flight.itemID,
      sequenceNum: 2,
      lastModified: flight.lastModified,
      data: PadString(flight.depAirportAddress, 64)
    },
    {
      itemID: flight.itemID,
      sequenceNum: 3,
      lastModified: flight.lastModified,
      data: PadString(flight.arrAirportName, 64)
    },
    {
      itemID: flight.itemID,
      sequenceNum: 4,
      lastModified: flight.lastModified,
      data: PadString(flight.arrAirportAddress, 64)
    },
    {
      itemID: flight.itemID,
      sequenceNum: 5,
      lastModified: flight.lastModified,
      data: 
        PadString(flight.airlineCode, 8) +
        PadString(flight.flightNumber, 8) +
        PadString(flight.airlineName, 48)
    },
    {
      itemID: flight.itemID,
      sequenceNum: 6,
      lastModified: flight.lastModified,
      data:
        PadString(flight.depAirportIATA, 3) +
        PadString(flight.depTimezoneAbbr, 5) +
        PackTime(flight.depTimeYear, flight.depTimeDay, flight.depTimeMin) +
        PackTime(flight.depTimeDestZoneYear, flight.depTimeDestZoneDay, flight.depTimeDestZoneMin) +
        PackTime(flight.boardingTimeYear, flight.boardingTimeDay, flight.boardingTimeMin) +
        PadString(flight.boardingGroup, 2) +
        PadString(flight.gate, 4) +
        PadString(flight.depTimezoneOffset, 1) +
        PadString(flight.arrTimezoneOffset, 1) +
        PadString(flight.arrAirportIATA, 3) +
        PadString(flight.arrTimezoneAbbr, 5) +
        PackTime(flight.arrTimeYear, flight.arrTimeDay, flight.arrTimeMin) +
        PackTime(flight.arrTimeDestZoneYear, flight.arrTimeDestZoneDay, flight.arrTimeDestZoneMin)
    }
  ];
  return extensions;
}

// takes a Hotel and packs into 4 Extensions
// pads out fields to required length, but assumes they are not too long
export function HotelToExtensions(hotel: Hotel) {
  const extensions: Extension[] = [
    {
      itemID: hotel.itemID,
      sequenceNum: 1,
      lastModified: hotel.lastModified,
      data: PadString(hotel.name, 64)
    },
    {
      itemID: hotel.itemID,
      sequenceNum: 2,
      lastModified: hotel.lastModified,
      data: PadString(hotel.address, 128).substring(0, 64)
    },
    {
      itemID: hotel.itemID,
      sequenceNum: 3,
      lastModified: hotel.lastModified,
      data: PadString(hotel.address, 128).substring(64, 128)
    },
    {
      itemID: hotel.itemID,
      sequenceNum: 4,
      lastModified: hotel.lastModified,
      data:
        PackTime(hotel.checkinTimeYear, hotel.checkinTimeDay, hotel.checkinTimeMin) +
        PackTime(hotel.checkoutTimeYear, hotel.checkoutTimeDay, hotel.checkoutTimeMin) +
        PadString(hotel.timezoneAbbrev, 5) +
        PadString(hotel.timezoneOffset, 1) +
        PadString(hotel.roomNumber, 10) +
        "\0".repeat(32)
    }
  ];
  return extensions;
}

// Extensions to eventType

// convert 6 Extensions into a single Flight
// returns undefined if Extension array is not of proper length
export function ExtensionsToFlight(data: Extension[]) {
  if (data.length != 6) return undefined;
  const ext1 = data[0]!.data;
  const ext2 = data[1]!.data;
  const ext3 = data[2]!.data;
  const ext4 = data[3]!.data;
  const ext5 = data[4]!.data;
  const ext6 = data[5]!.data;
  const flight: Flight = {
    itemID: data[0]!.itemID,
    lastModified: data[0]!.lastModified,
    depAirportName: UnpadString(ext1),
    depAirportAddress: UnpadString(ext2),
    arrAirportName: UnpadString(ext3),
    arrAirportAddress: UnpadString(ext4),
    airlineCode: UnpadString(ext5.substring(0, 8)),
    flightNumber: UnpadString(ext5.substring(8, 16)),
    airlineName: UnpadString(ext5.substring(16, 64)),
    depAirportIATA: UnpadString(ext6.substring(0, 3)),
    depTimezoneAbbr: UnpadString(ext6.substring(3, 8)),
    depTimeYear: ToBuffer(ext6.substring(8, 12)).readInt32LE(0),
    depTimeDay: ToBuffer(ext6.substring(12, 14)).readInt16LE(0),
    depTimeMin: ToBuffer(ext6.substring(14, 16)).readInt16LE(0),
    depTimeDestZoneYear: ToBuffer(ext6.substring(16, 20)).readInt32LE(0),
    depTimeDestZoneDay: ToBuffer(ext6.substring(20, 22)).readInt16LE(0),
    depTimeDestZoneMin: ToBuffer(ext6.substring(22, 24)).readInt16LE(0),
    boardingTimeYear: ToBuffer(ext6.substring(24, 28)).readInt32LE(0),
    boardingTimeDay: ToBuffer(ext6.substring(28, 30)).readInt16LE(0),
    boardingTimeMin: ToBuffer(ext6.substring(30, 32)).readInt16LE(0),
    boardingGroup: UnpadString(ext6.substring(32, 34)),
    gate: UnpadString(ext6.substring(34, 38)),
    depTimezoneOffset: UnpadString(ext6.substring(38, 39)),
    arrTimezoneOffset: UnpadString(ext6.substring(39, 40)),
    arrAirportIATA: UnpadString(ext6.substring(40, 43)),
    arrTimezoneAbbr: UnpadString(ext6.substring(43, 48)),
    arrTimeYear: ToBuffer(ext6.substring(48, 52)).readInt32LE(0),
    arrTimeDay: ToBuffer(ext6.substring(52, 54)).readInt16LE(0),
    arrTimeMin: ToBuffer(ext6.substring(54, 56)).readInt16LE(0),
    arrTimeDestZoneYear: ToBuffer(ext6.substring(56, 60)).readInt32LE(0),
    arrTimeDestZoneDay: ToBuffer(ext6.substring(60, 62)).readInt16LE(0),
    arrTimeDestZoneMin: ToBuffer(ext6.substring(62, 64)).readInt16LE(0)
  };
  return flight;
}

// convert 4 Extensions to a single Hotel
// returns undefined if Extension array is not of proper length
export function ExtensionsToHotel(data: Extension[]) {
  if (data.length != 4) return undefined;
  const ext1 = data[0]!.data;
  const ext2 = data[1]!.data;
  const ext3 = data[2]!.data;
  const ext4 = data[3]!.data;
  const hotel: Hotel = {
    itemID: data[0]!.itemID,
    lastModified: data[0]!.lastModified,
    name: UnpadString(ext1),
    address: UnpadString(ext2 + ext3),
    checkinTimeYear: ToBuffer(ext4.substring(0, 4)).readInt32LE(0),
    checkinTimeDay: ToBuffer(ext4.substring(4, 6)).readInt16LE(0),
    checkinTimeMin: ToBuffer(ext4.substring(6, 8)).readInt16LE(0),
    checkoutTimeYear: ToBuffer(ext4.substring(8, 12)).readInt32LE(0),
    checkoutTimeDay: ToBuffer(ext4.substring(12, 14)).readInt16LE(0),
    checkoutTimeMin: ToBuffer(ext4.substring(14, 16)).readInt16LE(0),
    timezoneAbbrev: UnpadString(ext4.substring(16, 21)),
    timezoneOffset: UnpadString(ext4.substring(21, 22)),
    roomNumber: UnpadString(ext4.substring(22, 32))
  };
  return hotel;
}

// helpers

function TimestampYear(time: Timestamp) {
  return time.year;
}

function TimestampDay(time: Timestamp) {
  return getDayOfYear(time);
}

function TimestampMin(time: Timestamp) {
  return (time.hour * 60) + time.minute;
}

// converts year+day+minute into an 8-byte string
function PackTime(year: number, day: number, minute: number) {
  const result = Buffer.alloc(8);
  result.writeUint32LE(year, 0);
  result.writeUint16LE(day, 4);
  result.writeUint16LE(minute, 6);
  return result.toString('binary');
}

function ValidateBigint(int: bigint | undefined) {
  if (int == undefined) return 0n;
  return int;
}

function ValidateTimestamp(time: Timestamp | undefined) {
  if (time == undefined) return convertTimeAndDateToTimestamp("2001-01-01", "00:00");
  return time;
}

function ToBuffer(str: string) {
  return Buffer.from(str, 'binary');
}
