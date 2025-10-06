/*
 * Authors: Kevin Sirantoine, Rachel Patella
 * Created: 2025-09-10
 * Updated: 2025-10-06
 *
 * This file Initializes the SQLite database, prepares queries, and exports functions for interacting with the
 * SQLite database.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as sql from "./sql";

// local.db located in ..\AppData\Roaming\Electron
const dbPath = path.join(app.getPath('userData'), 'local.db');
const db = new Database(dbPath);

// Create tables if not exists
db.exec(sql.createNotesTable);
db.exec(sql.createRemindersTable);
db.exec(sql.createDailyTable);
db.exec(sql.createWeeklyTable);
db.exec(sql.createMonthlyTable);
db.exec(sql.createYearlyTable);
db.exec(sql.createGeneratedTable);
db.exec(sql.createExtensionsTable);
db.exec(sql.createOverridesTable);
db.exec(sql.createFoldersTable);
db.exec(sql.createDeletedTable);

// Example db
// test.db located in ..\AppData\Roaming\Electron
const exDBPath = path.join(app.getPath('userData'), 'test.db');
const exDB = new Database(exDBPath);

// Create example table if not exists
exDB.exec(sql.createExTable);

// prepare all sql queries once
const createExEntry = exDB.prepare(sql.createExEntry);
const readExEntry = exDB.prepare(sql.readExEntry);
const updateExEntry = exDB.prepare(sql.updateExEntry);
const deleteExEntry = exDB.prepare(sql.deleteExEntry);

// Create entry in example table
export function create(key: string, value: string) {
  createExEntry.run(key, value);
}

// Read entry from example table
export function read(key: string) {
  const row = readExEntry.get(key) as { value: string } | undefined;

  if (!row) return 'Not found';
  return row.value;
}

// Update entry in example table
export function update(key: string, value: string) {
  updateExEntry.run(value, key);
}

// Delete entry from example table
export function deleteEntry(key: string) {
  deleteExEntry.run(key);
}
