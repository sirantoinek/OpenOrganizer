# OpenOrganizer
A cross-platform desktop reminder and note-taking calendar application built with user control, complete data ownership, and security as core principles.

<img src="/doc/OpenOrganizer_Screenshot.png" width="700" alt="OpenOrganizer Screenshot">

## Features:
* Cross-platform support (Windows & Linux)
* Store data with opt-in cloud syncing for easy remote backup and use between multiple devices
* Keep data secure by encrypting it for transmission and cloud storage to where not even the server can read it
* Create daily, weekly, bi-weekly, monthly, and yearly recurring reminders
* Sort reminders and notes into color-coded folders for easy organization
* ... and more!

## Team Members:
* Kevin Sirantoine
* Rachel Patella
* Michael Jagiello
* Maria Pasaylo

# Installation

## Prerequisites

These are the utilities used to build or run the application. 
The listed versions are what we have used and tested, but this does not mean that they are strictly required.

### Client:
* Node v23

### Server:
* Golang 1.24
* GCC
* PostgreSQL 17.4

To clone the repository, just use the standard `git clone LINK` and `cd OpenOrganizer` in your terminal.

## Client Setup Instructions

1. `cd client`
2. `npm install`
3. `npm run rebuild`
4. `npm install -g @quasar/cli`

Note: If running the testing suite, make a file named `testing.txt` containing `TRUE` in the `./client/public/` directory.

5. To build and run the application:
* `quasar dev` to run in the browser **(UI testing only)**
* `quasar dev -m electron` to build and run a dev version of the application
* `quasar build -m electron` to build executable

6. Once in the application, go to the settings icon in the bottom right, navigate to the LOCAL submenu, and input the server address and save. Ensure that this is the full address, including the `http://` prefix and `/` suffix.

## Server Setup Instructions

An external SQL Database application is required for the server. 
Our team has tested and uses PostgreSQL 17.4.
It is required to set up PostgreSQL and get database access information to be able to pass to the `.env` file.

1. `cd server`
2. Create a file named `.env` here in `./server/` and fill in your data following this format (default values shown for optional fields):
```
# optional: run only to be accessible from the local device
LOCAL_ONLY="FALSE"
# required: whether to launch HTTPS, which then redirects HTTP requests to HTTPS
HTTPS="FALSE"
# required: port to await HTTP requests
SERVER_PORT_HTTP="3001"
# required if using HTTPS: port to await HTTPS requests
SERVER_PORT_HTTPS="3003"
# required if using HTTPS: file name for the certificate
SERVER_CRT="server.crt"
# required if using HTTPS: file name for the private key
SERVER_KEY="server.key"
# required: database address
DB_HOST="localhost"
# required: database port
DB_PORT="3002"
# required: database username
DB_USER="postgres"
# required: database password
DB_PWD="password"
# optional: whether to refresh authentication token expiration time upon use
TOKEN_EXPIRE_REFRESH="TRUE"
# optional: integer time in seconds for authentication tokens to expire
TOKEN_EXPIRE_TIME="3600"
# optional: integer time in seconds between each time the server purges all expired tokens
TOKEN_PURGE_INTERVAL="3600"
# optional: integer maximum number of transmitted records per syncup/syncdown request/response
MAX_RECORD_COUNT="1000"
# optional: clears the database auth tables (users, tokens, lastUpdated) upon server launch
CLEAR_DB_AUTH="FALSE"
# optional: clears all other database tables upon server launch
CLEAR_DB_DATA="FALSE"
# optional: runs the automated testing suite upon launch (WARNING: CLEARS DATABASE)
TEST_SUITE="FALSE"
# optional: integer delay in seconds before the testing suite begins to avoid accidental data deletion
TEST_SUITE_DELAY="20"
```
3. To build / run the application:
* `make` (or `mingw32-make` for some on Windows) will fully build and run the application
* `make build` to only build in `./server/bin/`
* `make run` to only run the executable in `./server/bin/`

# Technologies Used

### Client:
* **[TypeScript](https://github.com/microsoft/TypeScript)**
* **[Node.js](https://github.com/nodejs/node)**
* **[Vue.js](https://github.com/vuejs/core)**
* **[Quasar](https://github.com/quasarframework/quasar)**
* **[Electron](https://github.com/electron/electron)**
* **[SQLite](https://github.com/sqlite/sqlite)**
* **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)**
* **[electron-store](https://github.com/sindresorhus/electron-store)**
* **[node-cron](https://github.com/kelektiv/node-cron)**
* **[vue-router](https://github.com/vuejs/router)**
* **[QCalendar](https://github.com/quasarframework/quasar-ui-qcalendar)**
* **[Axios](https://github.com/axios/axios)**

### Server:
* **[Golang](https://github.com/golang/go)**
* **[PostgreSQL](https://github.com/postgres/postgres)**
* **[godotenv](https://github.com/joho/godotenv)**
* **[pq](https://github.com/lib/pq)**
