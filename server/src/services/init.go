/*
 * Authors: Michael Jagiello
 * Created: 2025-09-20
 * Updated: 2025-11-24
 *
 * This file handles many of the initialization functions, such as pulling .env variables and assigning handlers for HTTP requests.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

package services

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"openorganizer/src/models"
)

var maxRecordCount uint32

// retrieves vital variables from local .env file
func RetrieveENVVars() (env models.ENVVars, err error) {
	if err := godotenv.Load(); err != nil {
		fmt.Printf("error loading: %v\n", err)
		return env, err
	}

	env.LOCAL_ONLY = false
	var LOCAL_ONLY = strings.ToUpper(os.Getenv("LOCAL_ONLY"))
	if LOCAL_ONLY == "TRUE" {
		env.LOCAL_ONLY = true
	}

	var HTTPS = strings.ToUpper(os.Getenv("HTTPS"))
	var SERVER_CRT = os.Getenv("SERVER_CRT")
	var SERVER_KEY = os.Getenv("SERVER_KEY")
	var SERVER_PORT_HTTPS = strings.ToUpper(os.Getenv("SERVER_PORT_HTTPS"))
	if HTTPS == "TRUE" {
		env.HTTPS = true
		if SERVER_PORT_HTTPS == "" {
			return env, errors.New("SERVER_PORT_HTTPS is null")
		}
		if SERVER_CRT == "" {
			return env, errors.New("SERVER_CRT is null")
		}
		if SERVER_KEY == "" {
			return env, errors.New("SERVER_KEY is null")
		}
		env.SERVER_PORT_HTTPS = SERVER_PORT_HTTPS
	} else if HTTPS == "FALSE" {
		env.HTTPS = false
	} else {
		return env, errors.New("HTTPS is invalid, use TRUE or FALSE")
	}

	var SERVER_PORT_HTTP = os.Getenv("SERVER_PORT_HTTP")
	if SERVER_PORT_HTTP == "" {
		return env, errors.New("SERVER_PORT_HTTP is null")
	}

	var DB_HOST = os.Getenv("DB_HOST")
	if DB_HOST == "" {
		return env, errors.New("DB_HOST is null")
	}
	var DB_PORT = os.Getenv("DB_PORT")
	if DB_PORT == "" {
		return env, errors.New("DB_HOST is null")
	}
	var DB_USER = os.Getenv("DB_USER")
	if DB_USER == "" {
		return env, errors.New("DB_USER is null")
	}
	var DB_PWD = os.Getenv("DB_PWD")
	if DB_PWD == "" {
		return env, errors.New("DB_PWD is null")
	}

	env.SERVER_PORT_HTTP = SERVER_PORT_HTTP
	env.SERVER_CRT = SERVER_CRT
	env.SERVER_KEY = SERVER_KEY
	env.DB_HOST = DB_HOST
	env.DB_PORT = DB_PORT
	env.DB_USER = DB_USER
	env.DB_PWD = DB_PWD

	env.TOKEN_EXPIRE_REFRESH = false
	var TOKEN_EXPIRE_REFRESH = os.Getenv("TOKEN_EXPIRE_REFRESH")
	if TOKEN_EXPIRE_REFRESH == "TRUE" {
		env.TOKEN_EXPIRE_REFRESH = true
	}
	var TOKEN_EXPIRE_TIME = os.Getenv("TOKEN_EXPIRE_TIME")
	if TOKEN_EXPIRE_TIME == "" {
		TOKEN_EXPIRE_TIME = "3600"
	}
	var TOKEN_PURGE_INTERVAL = os.Getenv("TOKEN_PURGE_INTERVAL")
	if TOKEN_PURGE_INTERVAL == "" {
		TOKEN_PURGE_INTERVAL = "3600"
	}
	var MAX_RECORD_COUNT = os.Getenv("MAX_RECORD_COUNT")
	if MAX_RECORD_COUNT == "" {
		MAX_RECORD_COUNT = "1000"
	}

	tokenExpireTime, err := strconv.Atoi(TOKEN_EXPIRE_TIME)
	if err != nil {
		return env, errors.New("invalid value in TOKEN_EXPIRE_TIME, must be convertible to int32")
	}
	tokenPurgeInterval, err := strconv.Atoi(TOKEN_PURGE_INTERVAL)
	if err != nil {
		return env, errors.New("invalid value in TOKEN_PURGE_INTERVAL, must be convertible to int32")
	}
	recordCount, err := strconv.Atoi(MAX_RECORD_COUNT)
	if err != nil {
		return env, errors.New("invalid value in MAX_RECORD_COUNT, must be convertible to int32")
	}
	env.TOKEN_EXPIRE_TIME = uint32(tokenExpireTime)
	env.TOKEN_PURGE_INTERVAL = uint32(tokenPurgeInterval)
	env.MAX_RECORD_COUNT = uint32(recordCount)
	maxRecordCount = uint32(recordCount)

	env.CLEAR_DB_AUTH = false
	var CLEAR_DB_AUTH = os.Getenv("CLEAR_DB_AUTH")
	if CLEAR_DB_AUTH == "TRUE" {
		env.CLEAR_DB_AUTH = true
	}
	env.CLEAR_DB_DATA = false
	var CLEAR_DB_DATA = os.Getenv("CLEAR_DB_DATA")
	if CLEAR_DB_DATA == "TRUE" {
		env.CLEAR_DB_DATA = true
	}
	env.TEST_SUITE = false
	var TEST_SUITE = os.Getenv("TEST_SUITE")
	if TEST_SUITE == "TRUE" {
		env.TEST_SUITE = true
	}
	var TEST_SUITE_DELAY = os.Getenv("TEST_SUITE_DELAY")
	if TEST_SUITE_DELAY == "" {
		TEST_SUITE_DELAY = "20"
	}
	testSuiteDelay, err := strconv.Atoi(TEST_SUITE_DELAY)
	if err != nil {
		return env, errors.New("invalid value in TOKEN_EXPIRE_TIME, must be convertible to int32")
	}
	env.TEST_SUITE_DELAY = uint16(testSuiteDelay)

	return env, err
}

// assigns HTTP routes to their respective handling functions
func AssignHandlers() {
	http.HandleFunc("/", root)
	http.HandleFunc("/register", register)
	http.HandleFunc("/login", login)
	http.HandleFunc("/changelogin", changeLogin)
	http.HandleFunc("/lastupdated", lastUpdated)

	http.HandleFunc("/syncup/notes", upNotes)
	http.HandleFunc("/syncup/reminders", upReminders)
	http.HandleFunc("/syncup/reminders/daily", upRemindersDaily)
	http.HandleFunc("/syncup/reminders/weekly", upRemindersWeekly)
	http.HandleFunc("/syncup/reminders/monthly", upRemindersMonthly)
	http.HandleFunc("/syncup/reminders/yearly", upRemindersYearly)
	http.HandleFunc("/syncup/extensions", upExtensions)
	http.HandleFunc("/syncup/overrides", upOverrides)
	http.HandleFunc("/syncup/folders", upFolders)
	http.HandleFunc("/syncup/deleted", upDeleted)

	http.HandleFunc("/syncdown/notes", downNotes)
	http.HandleFunc("/syncdown/reminders", downReminders)
	http.HandleFunc("/syncdown/reminders/daily", downRemindersDaily)
	http.HandleFunc("/syncdown/reminders/weekly", downRemindersWeekly)
	http.HandleFunc("/syncdown/reminders/monthly", downRemindersMonthly)
	http.HandleFunc("/syncdown/reminders/yearly", downRemindersYearly)
	http.HandleFunc("/syncdown/extensions", downExtensions)
	http.HandleFunc("/syncdown/overrides", downOverrides)
	http.HandleFunc("/syncdown/folders", downFolders)
	http.HandleFunc("/syncdown/deleted", downDeleted)
}

// initialize HTTP (and HTTPS) servers
func Run(env models.ENVVars) chan error {
	var localOnly string = ""
	if env.LOCAL_ONLY {
		localOnly = "localhost"
	}

	serverHTTP := http.Server{
		Addr: localOnly + ":" + env.SERVER_PORT_HTTP,
		// write must stay longer than read to have responses
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 3 * time.Second,
	}
	serverHTTPS := http.Server{
		Addr: localOnly + ":" + env.SERVER_PORT_HTTPS,
		// write must stay longer than read to have responses
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 3 * time.Second,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS13,
			MaxVersion: tls.VersionTLS13,
		},
	}
	if env.HTTPS {
		serverHTTP.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			redirectHTTPS(w, r, env)
		})
	}
	fmt.Printf("Max record count per transmission: %v\n", maxRecordCount)

	var errs = make(chan error)
	if env.HTTPS {
		go func() {
			fmt.Printf("Initializing HTTPS server at %s:%s\n", localOnly, env.SERVER_PORT_HTTPS)
			if err := serverHTTPS.ListenAndServeTLS(env.SERVER_CRT, env.SERVER_KEY); err != nil {
				errs <- err
			}
		}()
	}
	go func() {
		fmt.Printf("Initializing HTTP server at %s:%s\n", localOnly, env.SERVER_PORT_HTTP)
		if err := serverHTTP.ListenAndServe(); err != nil {
			errs <- err
		}
	}()

	return errs
}
