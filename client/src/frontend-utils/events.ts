/*
 * Authors: Rachel Patella
 * Created: 2025-10-23
 * Updated: 2025-11-27
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

   const getFolder = (folderID: bigint | null): UIFolder | null => {
    if (folderID === null) return null;
    return folders.find(folder => folder.folderID === folderID) ?? null;  
   };

  // Iterate through viewable calendar month reminders
  for (const reminder of reminders) {
        if (reminder.isSaved) {
        const eventColorNum = getFolder(reminder.folderID)?.colorCode?? -1;
        let eventColor: string;
        if (eventColorNum === -1) {
          eventColor = getEventTypeColor(eventTypes, reminder.eventType).toUpperCase();
        } else {
          eventColor = convertInttoHex(eventColorNum).toUpperCase();
        }
       // Build a single-day calendar event for each saved reminder in the viewable month
        events.push({
          id: reminder.itemID,
          title: reminder.title,
          date: reminder.date,
          color: eventColor,
          icon: getEventTypeIcons(eventTypes, reminder.eventType),
          isStart: true,
          // End day is true if single-day event (as its the start and end)
          isEnd: reminder.temporaryEventEndDay === reminder.date
        });

        // If reminder is a multi-event, create a marker on the end day (when viewed on calendar month)
        if (reminder.temporaryEventEndDateEnabled) {
      
          if (reminder.temporaryEventEndDay != reminder.date)  {
            events.push({
            id: reminder.itemID,
            title: reminder.title,
            date: reminder.temporaryEventEndDay,
            color: eventColor,
            icon: 'stop_circle',
            isEnd: true
            });
          } 
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
