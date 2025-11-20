
/*
 * Authors: Rachel Patella
 * Created: 2025-10-21
 * Updated: 2025-11-19
 *
 * This file contains interfaces that extend the shared-types with UI-specific fields.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import type { Note, Reminder, Folder } from '../../src-electron/types/shared-types'; 

// UI types extend client backend/shared-types model with UI-only fields for use in renderer
// Some fields can change in the UI (ex. folderID null until user selects a folder), but are set in stone for backend DB

// Shared-types note has itemID, lastModified, folderID, isExtended, title, text
export type UINote = Note & {
  // Temporary fields for editing in UI before saving
  temporaryTitle: string;
  temporaryText: string;
  temporaryFolderID: bigint | null; 
  temporaryLastModified: string;
  titleMessageError?: string;
  folderMessageError?: string;
  isSaved: boolean;
  isEditing: boolean; 
  isSelected: boolean; // checkbox selection
  expanded: boolean; // open or closed carat
  date: string; 
};

// Shared-types reminder has itemID, lastModified, folderID, EventType, isExtended, title, hasNotif, etc.
export type UIReminder = Reminder & {
  temporaryTitle: string;
  temporaryFolderID: bigint | null;
  temporaryNotificationTime: number | null;
  temporaryEventStartTime: string | null;
  temporaryEventEndTime: string | null;
  temporaryEventEndDay: string;
  temporaryLastModified: string;
  titleMessageError?: string;
  folderMessageError?: string;
  timeMessageError?: string;
  // Extension is always present (may be empty) to avoid undefined checks in UI. Still optional in backend
  extension: Record<string, string | number | null>;  // Essentially extension is a dictionary-like object with keys (ex. field names) and values  
  // useful for adding on custom event type fields/extensions that we may not know the types to yet
  // Reminder recurrence fields to fill out UI form
  recurrence?: recurrenceReminder | null;
  // Used to determine which series table the recurring reminders itemID is from
  originalRecurrenceType?: string | null;
  isRecurring: boolean;
  isSaved: boolean;
  isEditing: boolean; 
  isSelected: boolean;
  // Used to see saved reminder in list while user toggles recurrence
  isConverting: boolean;
  expanded: boolean;
  temporaryEventEndDateEnabled: boolean;
  // UI-only date field - calendar date selected for the reminder
  date: string;
};

// Recurrence reminder (holds all recurrence reminder types)
export type recurrenceReminder = {
  type: string;
  daily?: dailyReminder;
  weekly?: weeklyReminder;
  monthly?: monthlyReminder;
  yearly?: yearlyReminder;
};

export type dailyReminder = {
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number | null;
  everyNDays: number;
  seriesEndDate: string;
};

export type weeklyReminder = {
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number | null;
  everyNWeeks: number;
  daysOfWeek: string;
  seriesEndDate: string;
};

export type monthlyReminder = {
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number | null;
  lastDayOfMonth: boolean;
  daysOfMonth: string;
  seriesEndDate: string;
};

export type yearlyReminder = {
  timeOfDayMin: number;
  eventDurationMin: number;
  notifOffsetTimeMin: number | null;
  dayOfYear: number;
  seriesEndDate: string;
};

// Shared-types folder has folderID, lastModified, parentFolderID, colorCode, folderName
export type UIFolder = Folder & {
  temporaryFolderName: string;
  isSaved: boolean;
  isEditing: boolean; // flag if folder is currently being edited/renamed in UI
  folderNameError?: string;
  children?: UIFolder[];
};


