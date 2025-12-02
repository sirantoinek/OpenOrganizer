/*
 * Authors: Maria Pasaylo, Kevin Sirantoine
 * Created: 2025-10-07
 * Updated: 2025-12-02
 *
 * This file contains functions related to user authentication including getters
 * and setters for privateKey, username, password, and authToken.
 * This file will eventually contain login and account creation functions.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import { hash256, hash512_256, generatePrivateKey, encrypt, decrypt } from "app/src-electron/services/crypto";
import Store from 'electron-store';
import type { Schema } from 'electron-store';
import axios from 'axios';
import { clearAllTables } from "app/src-electron/db/sqlite-db";
import { serverAddress } from './store';

interface Account{
  username: string;
  password: string;
  privateKey1: Buffer;
  privateKey2: Buffer;
  authToken: Buffer;
  userId: string;
  autoSyncEnabled: boolean
}

const accountSchema: Schema<Account> ={
  username: {
    type: 'string',
    default: ''
  },
  password:{
    type: 'string',
    default: ''
  },
  privateKey1: {
    type:'object',
    default: Buffer.alloc(32)
  },
  privateKey2: {
    type:'object',
    default: Buffer.alloc(32)
  },
  authToken:{
    type: 'object',
    default: Buffer.alloc(32)
  },
  userId:{
    type: 'string',
    default: ''
  },
  autoSyncEnabled:{
    type: 'boolean',
    default: false
  }
}

const accountStore = new Store<Account>({
  schema: accountSchema,
  name: 'accountInfo'
});

function getUsername() {
  return accountStore.get('username');
}

function setUsername(username : string) {
  accountStore.set('username', username);
}

function getPassword() {
  return accountStore.get('password');
}

function setPassword(password : string) {
  accountStore.set('password', password);
}

export function getAuthToken() {
  return accountStore.get('authToken');
}

function setAuthToken(authToken : Buffer) {
  accountStore.set('authToken', authToken);
}

export function getPrivateKey1() {
  return Buffer.from(accountStore.get('privateKey1'));
}

function setPrivateKey1(privateKey : Buffer) {
  accountStore.set('privateKey1', privateKey);
}

function getPrivateKey2() {
  return Buffer.from(accountStore.get('privateKey2'));
}

function setPrivateKey2(privateKey : Buffer) {
  accountStore.set('privateKey2', privateKey);
}

export function getUserId() {
  return BigInt(accountStore.get('userId'));
}

function setUserId(userId : string) {
  accountStore.set('userId', userId);
}

export function getAutoSyncEnabled() {
  return accountStore.get('autoSyncEnabled');
}

export function setAutoSyncEnabled(autoSync : boolean) {
  accountStore.set('autoSyncEnabled', autoSync);
}


export async function createAccount(username : string, password : string): Promise<boolean> {
  // hash password, generate and store privateKey, encrypt privateKey with SHA256(password)
  setUsername(username);
  setPassword(password);
  setPrivateKey1(generatePrivateKey());
  setPrivateKey2(generatePrivateKey());
  const hashKeyPassword: Buffer = hash256(password);
  const hashServerPassword: Buffer = hash512_256(password);
  const encryptedPrivateKey1: Buffer = encrypt(getPrivateKey1(), hashKeyPassword, hashKeyPassword);
  const encryptedPrivateKey2: Buffer = encrypt(getPrivateKey2(), hashKeyPassword, hashKeyPassword);

  //Note do not send 0 for username
  const userData = Buffer.alloc(128,20);

  //Ensure username is max 32 bytes
  const usernameBuffer = Buffer.from(username).slice(0,32);

  //Store username[0:32], passwordHash[32:64], encr1[64:96], encr2[96:128] to send to server
  usernameBuffer.copy(userData, 0);
  hashServerPassword.copy(userData, 32);
  encryptedPrivateKey1.copy(userData, 64);
  encryptedPrivateKey2.copy(userData, 96);

  // Sending in raw data via API request to /register
  try{
    const serverURL = serverAddress.get('serverAddress');
    const response = await axios.post<ArrayBuffer>(`${serverURL}register`, userData, {
      'responseType': 'arraybuffer',
      headers:{'Content-Type': 'application/octet-stream'}
    });

    //Parse the reponse
    const responseData = response.data;

    console.log("REGISTER STATUS: " + response.status);

    // //userID [0:8], authToken[8:40]
    const userIdBytes = Buffer.from(responseData.slice(0, 8));
    const authTokenBytes = Buffer.from(responseData.slice(8, 40));
    setAuthToken(authTokenBytes);
    //read as little endian and need to convert to string because electron-store json does not support bigint
    setUserId(userIdBytes.readBigInt64LE(0).toString());
    setAutoSyncEnabled(true);


  } catch (error) {
    console.error("Error registering account.\n\n");
    return false;
  }

  return true;
  }


  export async function loginAccount(username? : string, password? : string): Promise<boolean> {
    if (username === undefined && password === undefined) {
      username = getUsername();
      password = getPassword();
    }
    else if (username !== undefined && password !== undefined) {
      setUsername(username);
      setPassword(password);
    }
    else return false;


    //hash the passwords
    const hashServerPassword: Buffer = hash512_256(password);
    const hashKeyPassword: Buffer = hash256(password);

    //Ensure username is max 32 bytes
    const usernameBuffer = Buffer.from(username).slice(0,32);

    //Store username[0:32], passwordHash[32:64] to send to server
    const userData = Buffer.alloc(64,20);
    usernameBuffer.copy(userData, 0);
    hashServerPassword.copy(userData, 32);

    //Sending in raw data via API request to /login
    try {
      const serverURL = serverAddress.get('serverAddress');
      const response = await axios.post<ArrayBuffer>(`${serverURL}login`, userData, {
        'responseType': 'arraybuffer',
        headers:{'Content-Type': 'application/octet-stream'}
      });

      // Parse and store the userID, authToken, decrypt encrypted private keys
      const responseData = response.data;

      //More testing
      console.log("LOGIN STATUS: " + response.status);

      //userID [0:8], authToken[8:40], privateKey1[40:72], privateKey2[72:104]
      const userIdBytes = Buffer.from(responseData.slice(0, 8));
      const authTokenBytes = Buffer.from(responseData.slice(8, 40));
      const encrPrivateKey1 = Buffer.from(responseData.slice(40,72));
      const encrPrivateKey2 = Buffer.from(responseData.slice(72,104));

      setAuthToken(authTokenBytes);
      //read as little endian and need to convert to string because electron-store json does not support bigint
      setUserId(userIdBytes.readBigInt64LE(0).toString());
      // Decrypt private keys and store them
      setPrivateKey1(decrypt(encrPrivateKey1, hashKeyPassword, hashKeyPassword));
      setPrivateKey2(decrypt(encrPrivateKey2, hashKeyPassword, hashKeyPassword));
      setAutoSyncEnabled(true);

    } catch (error){
      console.error("Error logging into account.\n\n");
      return false;
    }

    return true;
  }


   export async function changeLogin(newUsername?: string, newPassword? : string): Promise<boolean> {
    const oldUsername = getUsername();
    const oldPassword = getPassword();
    newUsername = newUsername || oldUsername;
    newPassword = newPassword || oldPassword;

    //update stored username and password
    setUsername(newUsername);
    setPassword(newPassword);

    //Ensure username is max 32 bytes
    const usernameBuffer = Buffer.from(newUsername).slice(0,32);
    const oldUsernameBuffer = Buffer.from(oldUsername).slice(0,32);

    //hash the passwords
    const hashNewPassword: Buffer = hash512_256(newPassword);
    const hashOldPassword: Buffer = hash512_256(oldPassword);

    //get the private keys
    const encrPrivateKey1: Buffer = getPrivateKey1();
    const encrPrivateKey2: Buffer = getPrivateKey2();

    //Store username[0:32], passwordHash[32:64], newUsername[64:96], newPasswordHash[96:128],
    //privateKey1[128:160], privateKey2[160:192] to send to server
    const userData = Buffer.alloc(192,20);
    oldUsernameBuffer.copy(userData, 0);
    hashOldPassword.copy(userData, 32);
    usernameBuffer.copy(userData, 64);
    hashNewPassword.copy(userData, 96);
    encrPrivateKey1.copy(userData, 128);
    encrPrivateKey2.copy(userData, 160);

    //testing output
    // console.log('CHANGE LOGIN USER DATA', userData.toString('utf8'));
    // console.log('CHANGE LOGIN USER DATA RAW', userData);
    // console.log('CHANGE LOGIN USER DATA LENGTH', userData.length);

    //Sending in raw data via API request to /changelogin
    try {
      const serverURL = serverAddress.get('serverAddress');
      const response = await axios.post<ArrayBuffer>(`${serverURL}changelogin`, userData, {
        'responseType': 'arraybuffer',
        headers:{'Content-Type': 'application/octet-stream'}
      });

      // Parse and store the userID, authToken, decrypt encrypted private keys
      const responseData = response.data;

      //userID [0:8], authToken[8:40]
      const userIdBytes = Buffer.from(responseData.slice(0, 8));
      const authTokenBytes = Buffer.from(responseData.slice(8, 40));

      //read as little endian and need to convert to string because electron-store json does not support bigint
      setUserId(userIdBytes.readBigInt64LE(0).toString());
      setAuthToken(authTokenBytes);
      setAutoSyncEnabled(true);


    } catch (error){
      console.error("Error changing username and password.\n\n");
      return false;
    }

    return true;
  }

  export async function isUserLoggedIn(): Promise<boolean> {
    return accountStore.get('userId') !== "";
  }

  export async function clearLocalData(): Promise<boolean> { // WARNING: clears account data and drops local tables
    accountStore.clear();
    clearAllTables();
    return true;
  }
