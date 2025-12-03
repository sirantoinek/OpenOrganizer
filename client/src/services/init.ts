/*
 * Authors: Michael Jagiello
 * Created: 2025-11-04
 * Updated: 2025-11-17
 *
 * This file handles important initialization features.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import * as test from "./test"

export async function init() {
    if (await FetchTestingBool() == true) {
        await test.TestingSuite();
    }
}

// if testing.txt is available with TRUE inside, return true
async function FetchTestingBool() {
    let testing: string = "";
    await fetch("testing.txt")
    .then((response) => response.text())
    .then((text) => {
        testing = text;
    }).catch((error) => console.error(error));
    if (testing.toUpperCase() === "TRUE") {
        return true;
    }
    return false;
}
