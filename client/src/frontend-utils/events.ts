/*
 * Authors: Rachel Patella
 * Created: 2025-10-23
 * Updated: 2025-11-28
 *
 * This file contains functions to build calendar events from reminders and retrieve event type details
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import type { UIReminder, UIFolder } from '../types/ui-types';
import {convertInttoHex} from '../frontend-utils/tree';
import { get } from 'axios';
import { event } from 'quasar';

// Reminder on calendar
export type CalendarEvent = {
  id: bigint;
  title: string;
  date: string;
  color: string;
  icon?: string
  isStart?: boolean;
  isEnd?: boolean;
};

export type EventField = { 
    id: string; 
    name: string; 
    type: string 
};

export type EventType = { 
   // Event type is a number, not bigint like itemID in backend
    id: number; 
    name: string; 
    color: string; 
    fields?: EventField[]; 
    icon: string;
};

// Function to get event type fields - will render different fields based on event type selected
export function getEventTypeFields(eventTypes: EventType[], selectedEventTypeID: number) {
  // Find the event type id in the eventTypes array that matches the user selected dropdown event type id
  const type = eventTypes.find(eventType => eventType.id === selectedEventTypeID);
  // If the event type is found, return the fields. Otherwise, return an empty array
  return type ? type.fields : [];
}

// Function to get event type icons - will render different icons based on event type selected
export function getEventTypeIcons(eventTypes: EventType[], selectedEventTypeID: number) {
  const type = eventTypes.find(eventType => eventType.id === selectedEventTypeID);
  // If the event type is found, return the icon. Otherwise, return a default icon
  return type ? type.icon : '';
}


// Function to get event type colors - will change checkbox to match event type color
export function getEventTypeColor(eventTypes: EventType[], selectedEventTypeID: number) {
  // Find the event type id in the eventTypes array that matches the user selected dropdown event type id
  const type = eventTypes.find(eventType => eventType.id === selectedEventTypeID);
  // If the event type is found, return the color. Otherwise, return a default color
  return type ? type.color : '#459DD8';
}

// Create events on calendar from reminders
// script source code similar to slot - day month example
// https://qcalendar.netlify.app/developing/qcalendar-month
export function buildCalendarEvents(reminders: UIReminder[], eventTypes: EventType[], folders: UIFolder[]): CalendarEvent[] {
   const events: CalendarEvent[] = [];
   // Ensure multiday events do not duplicate on calendar
   // This is because a multi-day reminder is technically one reminder that spans multiple days, not separate reminders for each day like generated
   // Therefore each reminder should only be processed once to create calendar events for each day in the range, use a set for no duplicates
   const reminderIDProcessed = new Set<string>();

   const getFolder = (folderID: bigint | null): UIFolder | null => {
    if (folderID === null) return null;
    return folders.find(folder => folder.folderID === folderID) ?? null;  
   };

  // Iterate through viewable calendar month reminders
  for (const reminder of reminders) {
    // Do not push calendar event for a recurring reminder
      if (reminder.isRecurring) {
        continue;
      }
       // Build a single-day calendar event for each saved reminder in the viewable month
       if (reminder.isSaved) {
        // Create a key for the reminder to check if it has been processed already
        const reminderKey = String(reminder.itemID);
        // Reminder has already been processed, skip to next reminder
        if (reminderIDProcessed.has(reminderKey)) {
          continue;
        }
        // Otherwise, reminder has not been processed yet, add to set
        reminderIDProcessed.add(reminderKey);

        // Get the color code from folder color if set, otherwise get from event type
        const eventColorNum = getFolder(reminder.folderID)?.colorCode?? -1;
        let eventColor: string;
        if (eventColorNum === -1) {
          eventColor = getEventTypeColor(eventTypes, reminder.eventType).toUpperCase();
        } else {
          eventColor = convertInttoHex(eventColorNum).toUpperCase();
        }
       // Get start and end date for the reminder
       const startDateStr = reminder.date;
       const endDateStr = reminder.temporaryEventEndDateEnabled ? reminder.temporaryEventEndDay : reminder.date;

      // Create date objects from start and end date to safely iterate through dates
      const [startYearString, startMonthString, startDayString] = startDateStr.split('-');
      const [endYearString, endMonthString, endDayString] = endDateStr.split('-');
      const startYear = Number(startYearString);
      const startMonth = Number(startMonthString);
      const startDay = Number(startDayString);
      const endYear = Number(endYearString);
      const endMonth = Number(endMonthString);
      const endDay = Number(endDayString);

      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);

      // Create a calendar event on every date in the range from the start to the end date
      while (startDate <= endDate) {
        // Local variable for current date string in YYYY-MM-DD format
        const currentDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;
        events.push({
          id: reminder.itemID,
          title: reminder.title,
          date: currentDate,
          color: eventColor,
          icon: getEventTypeIcons(eventTypes, reminder.eventType),
          // Start date is true if current date matches start date
          isStart: currentDate === startDateStr,
          // End date is true if current date matches end date
          // Both isStart and isEnd will be true for a same-day reminder (since startDate = endDate) for tooltip viewing
          isEnd: currentDate === endDateStr
        });
        // Increment date by one day for next iteration
        startDate.setDate(startDate.getDate() + 1);
      }
    }
  }
  return events;
}

// Map dates to array of events - key is date string, value is array of events on that date
// script source code similar to slot - day month example
// https://qcalendar.netlify.app/developing/qcalendar-month
export function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  events.forEach(event => {
    (map[event.date] = map[event.date] || []).push(event);
  });
  return map;
}

// Function to rename event start time label dependent on event type
export function getEventStartLabel(eventType: number) {
  // Flight
  if (eventType === 1) {
    return 'Flight Arrival Time';
  }
  // Hotel
  if (eventType === 2) {
    return 'Hotel Check-in Time';
  }
  // General
  return 'Event Start Time'; 
}

// Function to rename event start time label dependent on event type
export function getEventEndLabel(eventType: number) {
  // Flight
  if (eventType === 1) {
    return 'Flight Departure Time';
  }
  // Hotel
  if (eventType === 2) {
    return 'Hotel Check-out Time';
  }
  // General
  return 'Event End Time'; 
}

// Remove padding null characters from extension strings received by database for UI display
export function stripNulls(fieldString?: string | null): string {
  // Globally replace all null characters with empty string and trim whitespace
  return (fieldString ?? '').replace(/\0/g, '').trim();
}