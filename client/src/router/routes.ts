/* 
 * Authors: Rachel Patella, Michael Jagiello, Maria Pasaylo
 * Created: 025-04-13
 * Updated: 2025-11-28
 *
 * This file defines all the routes (pages in the application) for the Vue Router 
 *
 * References:
 * https://router.vuejs.org/guide/ 
 * https://quasar.dev/layout/routing-with-layouts-and-pages/
 * 
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and 
 * license terms outlined in the LICENSE file located in the top-level directory of 
 * this distribution. No part of OpenOrganizer, including this file, may be reproduced, 
 * modified, distributed, or otherwise used except in accordance with the terms 
 * specified in the LICENSE file.
-->
*/

import type { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('pages/CalendarPage.vue'),
  },
  {
      path: '/register', 
      component: () => import('pages/RegisterPage.vue')
  },
  {
      path: '/login', 
      component: () => import('pages/LoginPage.vue')
  },
  {
      path: '/calendar', 
      component: () => import('pages/CalendarPage.vue')
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
