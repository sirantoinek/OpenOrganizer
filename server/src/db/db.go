/*
 * Authors: Michael Jagiello
 * Created: 2025-09-20
 * Updated: 2025-12-03
 *
 * This file declares the database variable and includes databse interaction functions.
 * Included are for connecting to and closing the connection to the database, as well as functions for inserting into or selecting from.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

package db

import (
	"database/sql"
	"errors"
	"fmt"

	"openorganizer/src/models"
	"openorganizer/src/utils"
)

var db *sql.DB
var tokenExpireTime uint32
var tokenExpireRefresh bool

// connects to the postgresql server using provided env variables
func ConnectToDB(env models.ENVVars) error {
	pgConnStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", env.DB_HOST, env.DB_PORT, env.DB_USER, env.DB_PWD, "postgres")
	conn, err := sql.Open("postgres", pgConnStr)
	if err != nil {
		return err
	}
	db = conn
	err = db.Ping()

	tokenExpireTime = env.TOKEN_EXPIRE_TIME
	tokenExpireRefresh = env.TOKEN_EXPIRE_REFRESH

	return err
}

// creates all required db tables that do not already exist
func EnsureDBTables(env models.ENVVars) (errs []error) {
	if env.CLEAR_DB_AUTH {
		_, err := db.Exec(dropAllAuth)
		utils.PrintErrorLine(err)
		utils.AddError(err, errs)
	}

	if env.CLEAR_DB_DATA {
		_, err := db.Exec(dropAllData)
		utils.PrintErrorLine(err)
		utils.AddError(err, errs)
	}

	_, err := db.Exec(createTableUsers)
	utils.AddError(err, errs)
	_, err = db.Exec(createTableTokens)
	utils.AddError(err, errs)
	_, err = db.Exec(createTableLastUpdated)
	utils.AddError(err, errs)
	_, err = db.Exec(createTableItems("notes"))
	utils.AddError(err, errs)
	_, err = db.Exec(createTableItems("reminders"))
	utils.AddError(err, errs)
	_, err = db.Exec(createTableItems("daily_reminders"))
	utils.AddError(err, errs)
	_, err = db.Exec(createTableItems("weekly_reminders"))
	utils.AddError(err, errs)
	_, err = db.Exec(createTableItems("monthly_reminders"))
	utils.AddError(err, errs)
	_, err = db.Exec(createTableItems("yearly_reminders"))
	utils.AddError(err, errs)
	_, err = db.Exec(createTableExtensions)
	utils.AddError(err, errs)
	_, err = db.Exec(createTableOverrides)
	utils.AddError(err, errs)
	_, err = db.Exec(createTableFolders)
	utils.AddError(err, errs)
	_, err = db.Exec(createTableDeleted)
	utils.AddError(err, errs)

	return errs
}

// defer this function in main to close the database connection after program termination
func CloseDatabase() {
	db.Close()
}

func GetLastUpdated(userID int64) (row models.RowLastUpdated, err error) {
	rows, err := db.Query(lastupRead, userID)
	if err != nil {
		return models.RowLastUpdated{}, err
	}
	defer rows.Close()
	if !rows.Next() {
		return models.RowLastUpdated{}, errors.New("")
	}
	_ = rows.Scan(&row.UserID, &row.LastUpNotes, &row.LastUpReminders,
		&row.LastUpDaily, &row.LastUpWeekly, &row.LastUpMonthly, &row.LastUpYearly,
		&row.LastUpExtensions, &row.LastUpOverrides, &row.LastUpFolders, &row.LastUpDeleted)
	return row, nil
}

func UpdateLastup(fieldName string, userID int64, time int64) {
	_, _ = db.Exec(lastupUpdate(fieldName), userID, time)
}

// syncup

func InsertItems(tableName string, rows []models.RowItems) (fails []bool, err error) {
	fails = make([]bool, len(rows))
	for i, row := range rows {
		found, err := db.Query(insertItem(tableName), row.UserID, row.ItemID, row.LastModified, row.LastUpdated, row.EncryptedData)
		if err != nil {
			return nil, err
		}
		if !found.Next() {
			fails[i] = true
		}
		found.Close()
	}
	return fails, nil
}

func InsertExtensions(rows []models.RowExtensions) (fails []bool, err error) {
	fails = make([]bool, len(rows))
	for i, row := range rows {
		found, err := db.Query(insertExtension, row.UserID, row.ItemID, row.LastModified, row.LastUpdated, row.SequenceNum, row.EncryptedData)
		if err != nil {
			return nil, err
		}
		if !found.Next() {
			fails[i] = true
		}
		found.Close()
	}
	return fails, nil
}

func InsertOverrides(rows []models.RowOverrides) (fails []bool, err error) {
	fails = make([]bool, len(rows))
	for i, row := range rows {
		found, err := db.Query(insertOverride, row.UserID, row.ItemID, row.LastModified, row.LastUpdated, row.LinkedItemID, row.EncryptedData)
		if err != nil {
			return nil, err
		}
		if !found.Next() {
			fails[i] = true
		}
		found.Close()
	}
	return fails, nil
}

func InsertFolders(rows []models.RowFolders) (fails []bool, err error) {
	fails = make([]bool, len(rows))
	for i, row := range rows {
		found, err := db.Query(insertFolder, row.UserID, row.FolderID, row.LastModified, row.LastUpdated, row.EncryptedData)
		if err != nil {
			return nil, err
		}
		if !found.Next() {
			fails[i] = true
		}
		found.Close()
	}
	return fails, nil
}

// inserts received deleted rows and removes the row from its home table
func InsertDeleted(rows []models.RowDeleted) (fails []bool, err error) {
	fails = make([]bool, len(rows))
	for i, row := range rows {
		found, err := db.Query(insertDeleted, row.UserID, row.ItemID, row.LastModified, row.LastUpdated, row.ItemTable)
		if err != nil {
			return nil, err
		}
		if !found.Next() {
			fails[i] = true
		}
		found.Close()
		deleteRow(row)
	}
	return fails, nil
}

func deleteRow(row models.RowDeleted) {
	const notesTable int16 = 11
	const remindersTable int16 = 12
	const dailyTable int16 = 21
	const weeklyTable int16 = 22
	const monthlyTable int16 = 23
	const yearlyTable int16 = 24
	const overridesTable int16 = 31
	const foldersTable int16 = 32
	switch row.ItemTable {
	case notesTable:
		_, _ = db.Exec(deleteItem("notes"), row.UserID, row.ItemID)
	case remindersTable:
		_, _ = db.Exec(deleteItem("reminders"), row.UserID, row.ItemID)
	case dailyTable:
		_, _ = db.Exec(deleteItem("daily_reminders"), row.UserID, row.ItemID)
	case weeklyTable:
		_, _ = db.Exec(deleteItem("weekly_reminders"), row.UserID, row.ItemID)
	case monthlyTable:
		_, _ = db.Exec(deleteItem("monthly_reminders"), row.UserID, row.ItemID)
	case yearlyTable:
		_, _ = db.Exec(deleteItem("yearly_reminders"), row.UserID, row.ItemID)
	case overridesTable:
		_, _ = db.Exec(deleteItem("overrides"), row.UserID, row.ItemID)
	case foldersTable:
		_, _ = db.Exec(deleteFolder, row.UserID, row.ItemID)
	}
	_, _ = db.Exec(deleteItem("extensions"), row.UserID, row.ItemID)
}

// syncdown

func GetItemRows(tableName string, userID int64, startTime int64, endTime int64) (rows []models.RowItems, err error) {
	sqlRows, err := db.Query(getRows(tableName), userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer sqlRows.Close()
	for sqlRows.Next() {
		var row models.RowItems
		err = sqlRows.Scan(&row.UserID, &row.ItemID, &row.LastModified, &row.LastUpdated, &row.EncryptedData)
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}
	err = sqlRows.Err()
	if err != nil {
		return rows, err
	}
	return rows, nil
}

func GetExtensionRows(userID int64, startTime int64, endTime int64) (rows []models.RowExtensions, err error) {
	sqlRows, err := db.Query(getRows("extensions"), userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer sqlRows.Close()
	for sqlRows.Next() {
		var row models.RowExtensions
		err = sqlRows.Scan(&row.UserID, &row.ItemID, &row.LastModified, &row.LastUpdated, &row.SequenceNum, &row.EncryptedData)
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}
	err = sqlRows.Err()
	if err != nil {
		return rows, err
	}
	return rows, nil
}

func GetOverrideRows(userID int64, startTime int64, endTime int64) (rows []models.RowOverrides, err error) {
	sqlRows, err := db.Query(getRows("overrides"), userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer sqlRows.Close()
	for sqlRows.Next() {
		var row models.RowOverrides
		err = sqlRows.Scan(&row.UserID, &row.ItemID, &row.LastModified, &row.LastUpdated, &row.LinkedItemID, &row.EncryptedData)
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}
	err = sqlRows.Err()
	if err != nil {
		return rows, err
	}
	return rows, nil
}

func GetFolderRows(userID int64, startTime int64, endTime int64) (rows []models.RowFolders, err error) {
	sqlRows, err := db.Query(getRows("folders"), userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer sqlRows.Close()
	for sqlRows.Next() {
		var row models.RowFolders
		err = sqlRows.Scan(&row.UserID, &row.FolderID, &row.LastModified, &row.LastUpdated, &row.EncryptedData)
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}
	err = sqlRows.Err()
	if err != nil {
		return rows, err
	}
	return rows, nil
}

func GetDeletedRows(userID int64, startTime int64, endTime int64) (rows []models.RowDeleted, err error) {
	sqlRows, err := db.Query(getRows("deleted"), userID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	defer sqlRows.Close()
	for sqlRows.Next() {
		var row models.RowDeleted
		err = sqlRows.Scan(&row.UserID, &row.ItemID, &row.LastModified, &row.LastUpdated, &row.ItemTable)
		if err != nil {
			return nil, err
		}
		rows = append(rows, row)
	}
	err = sqlRows.Err()
	if err != nil {
		return rows, err
	}
	return rows, nil
}
