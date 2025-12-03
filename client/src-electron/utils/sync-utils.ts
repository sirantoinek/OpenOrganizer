/*
 * Authors: Kevin Sirantoine
 * Created: 2025-10-30
 * Updated: 2025-12-02
 *
 * This file defines helper functions used by both syncup.ts and syncdown.ts.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import axios from "axios";

export async function sendRequest(url: string, body: Buffer) {
  try {
    return await axios.post(url, body, {
      headers: { 'Content-Type': 'application/octet-stream' },
      responseType: 'arraybuffer',
    });
  }
  catch (error) {
    console.error('sync error\n\n');
  }
}

export function logResponse(url: string, response: Axios.AxiosXHR<unknown>): void {
  console.log('URL: ', url);
  console.log('Status: ', response.status);
  console.log('Status Text: ', response.statusText);
}

export function getDateNowBuffer() {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64LE(BigInt(Date.now()));
  return buffer;
}
