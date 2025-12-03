/*
 * Authors: Maria Pasaylo, Kevin Sirantoine
 * Created: 2025-09-17
 * Updated: 2025-12-02
 *
 * This module manages user data storage that persists between app sessions.
 * Data is stored in config.json in user data directory (e.g. C:\Users\<your username>\AppData\Roaming\Electron).
 *
 * References: https://github.com/sindresorhus/electron-store/tree/main
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import Store from 'electron-store';
import type { Schema } from 'electron-store';

// Define the blueprint for user data
interface LastUpdated {
  lastUpNotes: Buffer,
  lastUpReminders: Buffer,
  lastUpDaily: Buffer,
  lastUpWeekly: Buffer,
  lastUpMonthly: Buffer,
  lastUpYearly: Buffer,
  lastUpExtensions: Buffer,
  lastUpOverrides: Buffer,
  lastUpFolders: Buffer,
  lastUpDeleted: Buffer
}

// Define schema for the store to enforce data types and defaults
function defaultLastUp() {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64LE(-9223372036854775808n); // minimum value for bigint
  return buffer;
}

const lastUpdatedSchema: Schema<LastUpdated> = {
  lastUpNotes: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpReminders: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpDaily: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpWeekly: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpMonthly: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpYearly: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpExtensions: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpOverrides: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpFolders: {
    type: 'object',
    default: defaultLastUp()
  },
  lastUpDeleted: {
    type: 'object',
    default: defaultLastUp()
  }
};

export const lastUpdated = new Store<LastUpdated>({
  name: 'lastUpdated',
  schema: lastUpdatedSchema
});

// storing lastStartYear for use in initGeneratedTable()
interface LastStart {
  lastStartYear: number
}

const lastStartSchema: Schema<LastStart> = {
  lastStartYear: {
    type: 'number',
    default: -1
  }
};

export const lastStart = new Store<LastStart>({
  name: 'lastStart',
  schema: lastStartSchema
});

// storing ServerAddress for use in syncing
interface ServerAddress {
  serverAddress: string
}

const serverAddressSchema: Schema<ServerAddress> = {
  serverAddress: {
    type: 'string',
    default: "http://localhost:3001/"
  }
};

export const serverAddress = new Store<ServerAddress>({
  name: 'serverAddress',
  schema: serverAddressSchema
});
