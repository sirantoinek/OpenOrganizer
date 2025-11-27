<!--
 * Authors: Rachel Patella, Maria Pasaylo, Michael Jagiello
 * Created: 2025-09-22
 * Updated: 2025-11-22
 *
 * This file is the main home page that includes the calendar view, notes/reminders list, 
 * and a file explorer as a 3 column grid layout.
 *
 * References:
 * https://quasar.dev/vue-components/card/
 * https://quasar.dev/vue-components/tabs/
 * https://vuejs.org/guide/essentials/list to render reminder cards in a list
 * https://qcalendar.netlify.app/developing/qcalendar-month-mini-mode#mini-mode-theme for qcalendar code
 * https://vuejs.org/guide/essentials/watchers and https://codepen.io/mamyraoby/pen/zYaKwzZ for how to implement select all with checkboxes
 * https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript for building a nested folder data structure
 * https://qcalendar.netlify.app/developing/qcalendar-month for qcalendar month components and rendering slots of reminders
 * https://github.com/quasarframework/quasar/discussions/11048 for custom q-tree node headers
 * https://stackoverflow.com/questions/48351987/create-javascript-date-object-from-string-yyyy-mm-dd-in-local-timezone for constructing local date objects
 * https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript for record type and dynamically rendering event type fields
 * https://quasar.dev/vue-components/color-picker/
 * https://quasar.dev/vue-components/menu/
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and 
 * license terms outlined in the LICENSE file located in the top-level directory of 
 * this distribution. No part of OpenOrganizer, including this file, may be reproduced, 
 * modified, distributed, or otherwise used except in accordance with the terms 
 * specified in the LICENSE file.
-->

<template>
  <div class="calendar-container">
    <q-dialog v-model="showSettings">
      <q-card style="width: 500px" class="q-px-sm q-pb-md">
        <q-card-section>
          <div class="text-h6">Settings</div>
          <div class="settings-container">
            <div class="settings-sidebar">
              <q-tabs v-model="settingsTab" vertical>
                <q-tab style="color: #474747" name="cloud" label="Cloud" icon="cloud" />
                <q-tab style="color: #474747" name="local" label="Local" icon="storage" />
              </q-tabs>
            </div>
            <div v-if="settingsTab === 'cloud'">
              <q-toggle style="size:2px; font-size:18px" v-model="isCloudOn" label="Cloud Sync" @update:model-value="onToggleCloudSync" :disable="isSyncing"/>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showLoginOptions">
      <q-card style="width: 400px" class="q-px-sm q-pb-md">
        <q-card-section>
          <div class="row justify-around q-mt-md"> 
            <div class="text-h6">Account Options</div>
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
          <div class="row justify-around q-mt-md">
            <q-btn class="login-register-button" style="font-size: 15px; width: 10em" flat label="Change Login" @click="showChangeLogin = true" />            
            <q-btn class="login-register-button" style="font-size: 15px; width: 10em" flat label="Log out" @click=logout />
          </div>  
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showChangeLogin">
      <q-card style="width: 400px" class="q-px-sm q-pb-md">
        <q-card-section>
          <div class="text-h6">Enter New Username</div>
          <q-input v-model="newUsername" type="text"  square filled  placeholder="New Username" />
        </q-card-section>
        <q-card-section>
          <div class="text-h6">Enter New Password</div>
          <q-input v-model="newPassword" filled :type="isPwd ? 'password' : 'text'" placeholder="New Password">
                <template v-slot:append>
                <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"/>
                </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save Changes" @click=saveLoginChanges v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>



    <!-- Left column - File Explorer top row-->
    <div style="grid-area: file-explorer-search; padding: 20px" data-area="file-explorer-search">
      <q-input
        v-model="searchQuery"
        dense
        outlined
        placeholder="Search notes and reminders by title here..."
        class="search-input"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
     <!-- Left column - File Explorer middle row-->
      <div style="grid-area: file-explorer-folders; padding: 0px 10px; display: flex; flex-direction: column; height: 100%" data-area="file-explorer-folders">
        <!-- Breadcrumb path component itself -->
        <q-breadcrumbs>
          <q-breadcrumbs-el label="" />
        </q-breadcrumbs>
        <q-breadcrumbs>
          <!-- Each selectable item in breadcrumb path -->
            <q-breadcrumbs-el
            v-for="crumb in breadcrumbs"
            :key="String(crumb.id)"
            :label="crumb.label"
            @click="selectBreadcrumbItem(crumb.id)"
          /> 
        </q-breadcrumbs>
        <q-tree 
          :nodes="qNestedTree"
          node-key="id"
          no-connectors
          default-expand-all
          :selected="selectedFolderID"
          @update:selected="handleTreeSelection"
        >
          <!-- Render q-input box where node label (name) would be with custom slot -->
          <!-- How to add custom node header: https://github.com/quasarframework/quasar/discussions/11048 -->
          <template v-slot:default-header ="{ node }">
            <div style="display: flex; align-items: center" @click.stop @keypress.stop>
              <!-- find the UIFolder for this node and if that folder is editing, show it inline -->
              <template v-if="getFolder(node.id) && getFolder(node.id)!.isEditing">
                <q-input dense
                  :key="String(node.id)"
                  v-model="getFolder(node.id)!.temporaryFolderName"
                  :error="(getFolder(node.id)!.folderNameError) != ''"
                  :error-message="getFolder(node.id)!.folderNameError"
                  @keyup.enter.prevent="saveFolder(getFolder(node.id)!)"
                  @keyup.esc.prevent="cancelRename(getFolder(node.id)!)"
                  placeholder="Folder name"
                  style="min-width: 160px;"
                  maxlength="24"
                />
              </template>
              <template v-else-if="getReminder(node.id) && getReminder(node.id)!.isEditing">
                <q-input dense
                  :key="String(node.id)"
                  v-model="getReminder(node.id)!.temporaryTitle"
                  :error="(getReminder(node.id)!.titleMessageError) != ''"
                  :error-message="getReminder(node.id)!.titleMessageError"
                  @keyup.enter.prevent="saveReminder(getReminder(node.id)!)"
                  @keyup.esc.prevent="cancelRename(getReminder(node.id)!)"
                  placeholder="Reminder name"
                  style="min-width: 160px;"
                />
              </template>
              <template v-else-if="getNote(node.id) && getNote(node.id)!.isEditing">
                <q-input dense
                  :key="String(node.id)"
                  v-model="getNote(node.id)!.temporaryTitle"
                  :error="(getNote(node.id)!.titleMessageError) != ''"
                  :error-message="getNote(node.id)!.titleMessageError"
                  @keyup.enter.prevent="saveNote(getNote(node.id)!)"
                  @keyup.esc.prevent="cancelRename(getNote(node.id)!)"
                  placeholder="Note name"
                  style="min-width: 160px;"
                />
              </template>
              <!-- If not editing, simply show the folder name. If it has an icon (folder), show it -->
              <template v-else>
                <div class="row items-center">
                  <div clickable @contextmenu.prevent>
                      <div>
                         <q-icon v-if="node.icon" :name="node.icon" :color="node.iconColor" :style="node.iconStyle"/>
                      </div>
                      <!--Pop up pallette to choose color-->
                       <q-menu
                        touch-position
                        context-menu>
                          <q-color
                          v-model="colorHex"
                          default-view="palette"
                          :palette="[
                            '#D1495B', '#FF90B3','#F18805', 
                            '#F0A202', '#FFE066', '#103900',
                            '#9AC19A', '#459DD8','#C69DD2',
                            '#4814BD'
                          ]"
                          class="my-picker"
                          @update:model-value="saveFolderColor(getFolder(node.id))">
                          </q-color>
                        </q-menu>
                  </div>
                  <span>{{ node.label }}</span>
                </div>
              </template>
            </div>
          </template>
        </q-tree>
        
        <div style="display: flex; flex-wrap: wrap; align-items: center; margin-top: auto; gap: 4px;">
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="add"  label="Add" @click="addFolder()" />
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="delete"  label="Delete" @click="deleteTreeNode()" />
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="edit"  label="Rename" @click="renameTreeNode()" />
        </div>
      </div>
     
      <!-- Left column - File Explorer bottom row-->
      <div style="grid-area: file-explorer-cloud; padding: 20px 30px; display: flex; border-top: 1px solid #adadadcc; align-items: center; gap: 8px;" data-area="file-explorer-cloud">
        <div style="color: #474747; font-size: 1.15rem;">{{  syncStatusMessage }} </div>
        <q-icon :name="cloudIcon" size="20px" style="color: #474747" />
      </div>
      
    <!-- Middle column - List View of Notes/Reminders -->
    <div class="grid-seperator" style="background-color: #efefef; grid-area: reminder-notes;">
      <q-tabs v-model="tab" class="calendar-tabs dense">
        <q-tab name="reminders" icon="alarm" label="Reminders" />
        <q-tab name="notes" icon="note" label="Notes" />
      </q-tabs>
      <div class="row justify-between items-center">
        <div class="row items-center">
          <q-btn style="font-size: 15px" flat icon="add" @click="addArrayItem" class="q-mr-sm" />
          <q-checkbox v-model="selectAll" color="primary" label="Select All" />
        </div>
        <q-btn style="font-size: 15px" flat icon="delete" @click="deleteArrayItem"></q-btn>
      </div>
      <div class="reminder-note-card-container">
        <div v-if="tab === 'reminders'">
          <!-- Reminder Cards -->
          <q-card class="reminder-note-cards" v-for="item in filteredReminders" :key="String(item.itemID)">
            <q-expansion-item v-model="item.expanded" expand-icon="keyboard_arrow_down">
              <template v-slot:header>
                  <div class="reminder-header-container">
                    <q-checkbox :color="getEventTypeColor(eventTypes, item.eventType)" v-model="item.isSelected" class="q-mr-sm" />
                    <q-input
                      v-model="item.temporaryTitle"
                      :error="item.titleMessageError != ''"
                      :error-message="item.titleMessageError"
                      placeholder="Enter reminder title..."
                      borderless
                      dense
                      style="max-width: 450px; padding-top: 20px"
                      @click.stop
                      @focus.stop
                      maxlength="48"
                      />
                    </div>
              </template>
              <q-card-section>
                    <div style="padding-bottom:10px">
                      Event date: {{ eventDatetoLocaleString(item.date) }}<br>
                      Last modified: {{(item.temporaryLastModified) }}
                  </div>
                <q-checkbox
                  v-model="item.temporaryEventEndDateEnabled"
                  label="Multi‑day"
                  dense
                  hide-bottom-space
                  :color="getEventTypeColor(eventTypes, item.eventType)" 
                  style="margin-bottom:10px"
                />
                <q-select
                v-model="item.eventType"
                :options="eventTypeOptions"
                label="Event Type"
                emit-value
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
                <q-select
                v-model="item.temporaryFolderID"
                :options="folderDropdownOptions"
                label="Save in folder"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
              <q-select
                v-model="item.temporaryNotificationTime"
                :options="notificationOptions"
                label="Remind me:"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
              <!-- Hide generic reminders temporary event start and end time for event types -->
              <template v-if="item.eventType !== 1 && item.eventType !== 2">
              <q-input
                  v-model="item.temporaryEventStartTime"
                  :label="getEventStartLabel(item.eventType)"
                  type="time"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <!-- Extra fields for multi-day events -->
                <div v-if="item.temporaryEventEndDateEnabled">
                  <q-input
                        outlined
                        dense
                        v-model="item.temporaryEventEndTime"
                        type="time"
                        label="Event End Time"
                        style="background-color: #f2f2f2; margin-bottom: 10px;"
                      />
                      <q-input
                        outlined
                        dense
                        type="date"
                        label="Event End Date"
                        v-model="item.temporaryEventEndDay"
                        :min="endDateRange(item.date).min"
                        :max="endDateRange(item.date).max"
                        style="font-size: 12px; background-color: #f2f2f2; margin-bottom: 8px;"
                      >
                      </q-input>
                  </div>
                <q-input v-else
                  v-model="item.temporaryEventEndTime"
                  :label="getEventEndLabel(item.eventType)"
                  type="time"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />                
              </template>
              <!-- Render fields for selected event type - each input corresponds to its type -->
              <!-- Since flight has a lot of fields, add an expandable section to not overwhelm the user -->
              <template v-if="item.eventType === 1">
                <div class="flight-grid">
                  <q-input
                    v-model="item.extension.flightNumber"
                    label="Flight Number"
                    type="text"
                    outlined
                    dense
                    class="flight-full"
                    maxlength="8"
                  />
                  <q-input
                    v-model="item.extension.airlineName"
                    label="Airline Name"
                    type="text"
                    outlined
                    dense
                    class="flight-full"
                    maxlength="48"
                  />
                  <q-input
                    v-model="item.extension.depAirportIATA"
                    label="Departure Airport IATA"
                    type="text"
                    outlined
                    dense
                    class="flight-half"
                    maxlength="3"
                  />
                  <q-input
                    v-model="item.extension.arrAirportIATA"
                    label="Arrival Airport IATA"
                   type="text"
                    outlined
                    dense
                    class="flight-half"
                    maxlength="3"
                  />
                  <q-input
                    v-model="item.extension.depTime"
                    label="Departure Time"
                    type="time"
                    outlined
                    dense
                    class="flight-half"
                  />
                   <q-input
                    v-model="item.extension.arrTime"
                    label="Arrival Time"
                    type="time"
                    outlined
                    dense
                    class="flight-half"
                  />
                  <div v-if="item.temporaryEventEndDateEnabled" style="width:100%; grid-column: 1 / -1;">
                    <q-input
                      v-model="item.temporaryEventEndDay"
                      label="Flight Arrival Date"
                      outlined
                      dense
                      type="date" 
                      :min="endDateRange(item.date).min"
                      :max="endDateRange(item.date).max"
                      class="flight-full"
                      style="width: 100%"
                    />
                  </div>
                  <q-input
                    v-model="item.extension.gate"
                    label="Gate"
                    type="text"
                    outlined
                    dense
                    class="flight-full"
                    maxlength="4"
                  />
                </div>
                <q-expansion-item icon="tune" label="Advanced" expand-icon="keyboard_arrow_down">
                <div class="flight-grid">
                  <q-input 
                    v-model="item.extension.boardingTime" 
                    label="Boarding Time" 
                    type="time" 
                    outlined
                    dense
                    class="flight-full"
                  />
                  <q-input 
                    v-model="item.extension.boardingGroup" 
                    label="Boarding Group" type="text" 
                    dense 
                    outlined 
                    class="flight-full"
                    maxlength="2"
                  />
                  <q-input 
                    v-model="item.extension.depAirportName" 
                    label="Departure Airport Name" 
                    type="text" 
                    dense 
                    outlined 
                    class="flight-half"
                    maxlength="64"
                  />
                  <q-input 
                    v-model="item.extension.arrAirportName" 
                    label="Arrival Airport Name" 
                    type="text" 
                    dense 
                    outlined 
                    class="flight-half"
                    maxlength="64"
                  />
                  <q-input 
                    v-model="item.extension.depAirportAddress" 
                    label="Departure Airport Address" 
                    type="text" 
                    dense 
                    outlined 
                    class="flight-half"
                    maxlength="64"
                  />
                  <q-input 
                    v-model="item.extension.arrAirportAddress" 
                    label="Arrival Airport Address" 
                    type="text" 
                    dense 
                    outlined  
                    class="flight-half"
                    maxlength="64"
                  />
                  <q-input 
                    v-model="item.extension.airlineCode" 
                    label="Airline Code" 
                    type="text" 
                    dense 
                    outlined  
                    class="flight-full"
                    maxlength="8"
                  />
                 </div>
                </q-expansion-item>
              </template>
              <template v-else-if="item.eventType === 2">
                <div class="flight-grid"> 
                <q-input 
                v-model="item.extension.name" 
                label="Hotel Name" 
                type="text" 
                outlined 
                dense 
                class="flight-full"
                maxlength="64"
                />
                <q-input 
                v-model="item.extension.roomNumber" 
                label="Room Number" 
                type="text" 
                outlined 
                dense 
                class="flight-full"
                maxlength="10"
                />
                <q-input 
                v-model="item.extension.checkinTime" 
                label="Check-in time" 
                type="time" 
                outlined 
                dense 
                class="flight-half"
                />
                <q-input 
                v-model="item.extension.checkoutTime" 
                label="Check-out time" 
                type="time"
                outlined 
                dense 
                class="flight-half"
                />
                <div v-if="item.temporaryEventEndDateEnabled" style="width:100%; grid-column: 1 / -1;">
                  <q-input
                    outlined
                    dense
                    type="date"
                    label="Check-out Date"
                    v-model="item.temporaryEventEndDay"
                    :min="endDateRange(item.date).min"
                    :max="endDateRange(item.date).max"
                    style="width:100%;"
                    class = "flight-full"
                  />
                 </div>
                <q-input 
                v-model="item.extension.address" 
                label="Hotel Address" 
                type="text" 
                outlined 
                dense 
                class="flight-full"
                maxlength="128"
                />
               </div>
              </template>
              <template v-else>
              <div v-for="field in getEventTypeFields(eventTypes, item.eventType)" :key="field.id" style="margin-bottom: 10px">
                <q-input
                 v-if="field.type === 'text'"
                  v-model="item.extension[field.id]"
                  :type="field.type"
                  :label="field.name"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px;"
                />
                <q-input
                v-else-if="field.type === 'number'"
                v-model.number="item.extension[field.id]"
                :label="field.name"
                type="number"
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px;"
              />
              <q-input
                v-else-if="field.type === 'time'"
                v-model="item.extension[field.id]"
                :label="field.name"
                type="time"
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px;"
              />
              </div>
              </template>
              <!-- Use seperate v-if for error instead of :error prop because it's validating two inputs (arrival & departure) instead of 1 -->
              <div v-if="item.timeMessageError" style="color: #f44336; font-size: 13px; margin-bottom: 8px;">
                {{ item.timeMessageError }}
              </div>
                <div class="row">
                  <q-btn class="login-register-button" style="font-size: 15px; margin-right: 10px" flat label="Save" @click="saveReminder(item)"></q-btn>
                  <q-btn class="login-register-button" style="background-color: grey; font-size: 15px" flat label="Cancel" @click="cancelReminder(item)"></q-btn>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </div>
        <div v-if="tab === 'notes'">
          <!-- Note Cards -->
          <q-card class="reminder-note-cards" v-for="(item, index) in filteredNotes" :key="index">
            <q-expansion-item v-model="item.expanded" expand-icon="keyboard_arrow_down">
              <template v-slot:header>
                <div class="reminder-header-container">
                  <q-checkbox v-model="item.isSelected" class="q-mr-sm" />
                  <q-input
                      v-model="item.temporaryTitle"
                      :error="item.titleMessageError != ''"
                      :error-message="item.titleMessageError"
                      placeholder="Enter note title..."
                      borderless
                      dense
                      style="max-width: 300px; padding-top: 20px"
                      @click.stop
                      @focus.stop
                      maxlength="48"
                    />
                </div>
              </template>
              <!-- Emit-value makes it so the dropdown option only saves the value (ex. folder id = 1 rather than the whole object {folder: name, id, etc.}) -->
              <q-card-section>
                      <div style="padding-bottom:10px">
                      Last modified: {{ item.temporaryLastModified }}
                    </div>
                <q-select
                v-model="item.temporaryFolderID"
                :options="folderDropdownOptions"
                label="Save in folder"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
                <q-input class="note-box" outlined v-model="item.temporaryText" type="textarea" maxlength="64"
                  placeholder="Write your note here..." />
                <div class="row">
                  <!-- Pass in current note item from v-for to save that specific note -->
                  <q-btn class="login-register-button" style="font-size: 15px; margin-right: 10px" flat label="Save" @click="saveNote(item)"></q-btn>
                  <q-btn class="login-register-button" style="background-color: grey; font-size: 15px" flat label="Cancel" @click="cancelNote(item)"></q-btn>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Right column - Calendar (top row) -->
    <div style="grid-area: calendar; padding: 20px" data-area="calendar">
      <div style="display: flex; justify-content: center">
        <div style="
            max-width: 400px;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
          ">
          <div style="width: 100%; display: flex; justify-content: space-evenly">
            <div style="width: 50%; display: flex; justify-content: space-between">
              <span class="q-button" style="cursor: pointer; user-select: none;" @click="onToday">Today</span>
              <span class="q-button" style="cursor: pointer; user-select: none" @click="onPrev">&lt;</span>
              {{ formattedMonth }}
              <span class="q-button" style="cursor: pointer; user-select: none" @click="onNext">&gt;</span>
            </div>
            <div style="width: 30%; display: flex; justify-content: space-between">
              <span class="q-button" style="cursor: pointer; user-select: none" @click="addToYear(-1)">&lt;</span>
              {{ selectedYear }}
              <span class="q-button" style="cursor: pointer; user-select: none" @click="addToYear(1)">&gt;</span>
            </div>
          </div>
          <div style="display: flex; justify-content: center; align-items: center;">
            <div style="display: flex; max-width: 500px; width: 100%; flex-direction: column;"> 
              <q-calendar-month ref="calendar" v-model="selectedDate" mini-mode hoverable focusable
                :focus-type="['date', 'weekday']" :min-weeks="6" animated @change="onChange" @moved="onMoved"
                @click-date="onClickDate" @click-day="onClickDay" @click-workweek="onClickWorkweek"
                @click-head-workweek="onClickHeadWorkweek" @click-head-day="onClickHeadDay" style="height: 400px;" >
                <template #day="{ scope: { timestamp } }">
              <template v-for="event in eventsMap[timestamp.date]" :key="String(event.id)">
                <!--MARIA start here just call a function to change background-->
                <div
                  :class="['text-white', 'row', 'justify-start', 'items-center',  'event-card']"
                  :style="{backgroundColor: event.color, width: '100%', margin: '1px 0 0 0', padding: '0 6px', fontSize: '12px', cursor: 'pointer'}"
                  @click="onClickCalendarEvent(event)"
                >
                  <q-icon :name="event.icon || 'access_time'" size="14px" class="q-mr-xs" />
                  <div class="event-title" style="width: 100%; max-width: 100%;">
                  {{ event.title}}
                  </div>
                <!-- Tooltip on hover to clarify if event start or end -->
                <q-tooltip v-if="event.isStart || event.isEnd">
                  <!-- If single day, combined start and end labels. If multi-day start and end separate labels. -->
                  {{ (event.isStart && event.isEnd) ? 'Event start & end' : (event.isStart ? 'Event start' : 'Event end') }}
                </q-tooltip>
                </div>
              </template>
            </template>
              </q-calendar-month>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right column - Spacer (middle row, can be empty) -->
    <div style="grid-area: calendar-spacer;" data-area="calendar-spacer"></div>

    <!-- Right column - Settings/Account Buttons (bottom row) -->
    <div style="grid-area: account-settings; padding: 20px 30px; border-top: 1px solid #adadadcc; align-items: center; gap: 8px;"  data-area="account-settings">
      <div class="row justify-between items-center">
        <q-btn class="account-and-settings-button" flat icon="account_circle" @click=checkLoggedIn />
        <q-btn class="account-and-settings-button" flat icon="settings" @click="showSettings = true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {QCalendarMonth, addToDate, parseTimestamp, today, type Timestamp} from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/index.css';
import {buildCalendarEvents, groupEventsByDate, getEventTypeColor, getEventTypeFields, getEventStartLabel, getEventEndLabel, type EventType, type CalendarEvent} from '../frontend-utils/events';
import { buildBreadcrumbs, normalizeFolderID, buildRootNodes} from '../frontend-utils/tree';
import { convertTimeAndDateToTimestamp, convertNotificationTimestamp, minutesToHHMM, timeStamptoEpoch, normalizeDatePickerToCalendar, eventDatetoLocaleString } from '../frontend-utils/time';
import { ref, computed, watch, onMounted } from 'vue';
import type { UINote, UIReminder, UIFolder } from '../types/ui-types';
import type { Reminder, Note, Folder, Extension } from '../../src-electron/types/shared-types';
import {createNote, createReminder, createFolder, createRootFolder, readNote, readReminder, readAllFolders, updateNote, updateReminder, updateFolder, deleteItem, deleteFolder, readRemindersInRange, readNotesInRange} from '../utils/local-db';
import { FieldsToFlight, FieldsToHotel, FlightToExtensions, HotelToExtensions, ExtensionsToFlight, ExtensionsToHotel } from '../utils/eventtypes';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { ValidateFlight, ValidateHotel } from '../utils/validate';
import { QMenu, QColor } from 'quasar';



// Initialize active tab to reminder by default
const tab = ref('reminders');
const settingsTab = ref('cloud');
// Array of reminders 
const reminders = ref<UIReminder[]>([])
// Array of reminders by month for calendar
const monthReminders = ref<UIReminder[]>([])

// Helper function to determine days user can pick for event end day (from start day to one year later)
// Hard limits reminders to +1 year from start date for event duration
function endDateRange(startDate: string): { min: string; max: string } {
  // Normalize inputted date string to yyyy-mm-dd format
  let dateString = normalizeDatePickerToCalendar(startDate ?? '') || '';
  // If provided startDate is empty/invalid, fallback to currently selected calendar date
  if (!dateString) {
    dateString = normalizeDatePickerToCalendar(String(selectedDate.value ?? '')) || '';
  }
  if (dateString) {
    const [yearString, monthString, dayString] = dateString.split('-');
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    // Create a new start date object from inputted start date with 0 hours, minutes, seconds to compare full day
    const sDate = new Date(year, month - 1, day);
    sDate.setHours(0, 0, 0, 0);

    const endDate = new Date(sDate);
    // Takes the start date (0 time) and adds 365 
    // days to it for max end date
    endDate.setDate(endDate.getDate() + 365);

    const startString = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
    const endString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    // Return the min and max date strings in yyyy-mm-dd format for date picker
    return { min: startString, max: endString };
  }

  // If input is invalid or empty, return empty strings to satisfy the declared return type
  return { min: '', max: '' };
}

// List of notification options for when to be notified for reminder
// Value is minutes before the event start time
const notificationOptions = [
  { label: 'Never', value: null },
  { label: 'At time of event', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 }
  ];
// Array of notes
const notes = ref<UINote[]>([])

// Object of event types for UI
const eventTypes: EventType[] = [
   {
       // Generic event type (no extra type fields)
        id: 0, 
        name: 'General', 
        color: '#2473A8', 
        icon: 'event',
        fields: []
      },
    {
       // In backend each event type is assigned an integer - ex. flight - 1, hotel = 2, etc.
        id: 1,
        // Event type name 
        name: 'Flight',
        // Color-coded for display in reminder list
        color: 'red',
        icon: 'flight',
        // Fields for each event type
        fields: [
          // ID is the key of the input, name is name of the field displayed to user, type is input field type
          {id: 'airlineName', name: "Airline Name", type: 'text'},
          {id: 'airlineCode', name: "Airline Code", type: 'text'},
          {id: 'depAirportName', name: "Departure Airport", type: 'text'},
          {id: 'depAirportIATA', name: "Departure Airport IATA", type: 'text'},
          {id: 'depAirportAddress', name: "Departure Airport Address", type: 'text'},
          {id: 'depTime', name: "Departure Time", type: 'time'},
          {id: 'arrAirportName', name: "Arrival Airport", type: 'text'},
          {id: 'arrAirportIATA', name: "Arrival Airport IATA", type: 'text'},
          {id: 'arrAirportAddress', name: "Arrival Airport Address", type: 'text'},
          {id: 'arrTime', name: "Arrival Time", type: 'time'},
          {id: 'boardingGroup', name: "Boarding Group", type: 'text'},
          {id: 'boardingTime', name: "Boarding Time", type: 'time'},
          {id: 'flightNumber', name: "Flight Number", type: 'text'},
          {id: 'gate', name: "Gate Number", type: 'text'}
        ]
    },
    {
        id: 2,
        name: 'Hotel',
        color: 'green',
        icon: 'hotel',
        fields: [
          {id: 'name', name: "Hotel Name", type: 'text'},
          {id: 'address', name: "Hotel Address", type: 'text'},
          {id: 'checkinTime', name: "Check-in Time", type: 'time'},
          {id: 'checkoutTime', name: "Check-out Time", type: 'time'},
          {id: 'roomNumber', name: "Room Number", type: 'text'},
        ]
    }
    // can add any more event types here
  ];

  // Function to convert event type input fields into extension object for storing 
  // Passing in undefined for unused schema fields on frontend (timezone offsets, abbrev) -> will be normalize to ''
  function buildExtensionsForEventType(reminder: UIReminder): Extension[] {
  const extRecord = reminder.extension ?? {};
  // Use event end-day for multi-day events and event start-day for single day events
  const eventEndDay = reminder.temporaryEventEndDateEnabled
  // Uses end day from calendar picker in format YYYY-MM-DD (extra validation)
  ? (normalizeDatePickerToCalendar(reminder.temporaryEventEndDay)) : reminder.date;

  // Helper function to safely read string fields from extension record 
  const extensionString = (fieldKey: string): string | undefined => {
    // Lookup fields raw value from extension record by its key (ex. reminder.extension.airlineName)
    const fieldRawValue = extRecord[fieldKey];
    // If the field is missing (undefined), it has no value, treat as empty
    if (fieldRawValue === undefined || fieldRawValue === null) {
      return undefined;
    }
    // If the field exists, cast its value to string and trim whitespace or null terminators if there are any
    const fieldString = stripNulls(String(fieldRawValue).trim());
    return fieldString === '' ? undefined : fieldString;
  };

  // If extension field time exists, use it to build timestamps
  const extensionTime = (fieldKey: string): Timestamp | undefined => {
    const raw = extRecord[fieldKey];
    // Check that field exists in extension record (set in UI)
    if (raw !== undefined && raw !== null) {
      const fieldString = stripNulls(String(raw).trim());
      // If extension field exists and is not empty, convert to timestamp using UI-provided time
      if (fieldString !== '') {
        // Arrival and check-out time are built on event end day if provided (multi-day), else on event start day
        if (fieldKey === 'arrTime' || fieldKey === 'checkoutTime') {
          return convertTimeAndDateToTimestamp(eventEndDay, fieldString) ?? undefined;
        }
        // Departure, check-in, and boarding time are built on event start day
        if (fieldKey === 'depTime' || fieldKey === 'checkinTime' || fieldKey === 'boardingTime') {
          return convertTimeAndDateToTimestamp(reminder.date, fieldString) ?? undefined;
        }
      }
    }

    // Check if arrTime or checkOut time exist
    if (fieldKey === 'arrTime' || fieldKey === 'checkoutTime') {
      // If arrival time (end) is the key field, see if departure time (start) exists in record
      // Otherwise if check out time (end) is the key field, see if check in time (start) exists in record
      const startKey = (fieldKey === 'arrTime') ? 'depTime' : 'checkinTime';
      const startRaw = extRecord[startKey];
      if (startRaw !== undefined && startRaw !== null) {
        const startString = stripNulls(String(startRaw).trim());
        // If start time exists, derive end time using temporary logic rules from saveReminder
        if (startString !== '') {
          if (reminder.temporaryEventEndDateEnabled) {
            // If reminder is multi-day, end time is 23:59 on event end day
            return convertTimeAndDateToTimestamp(eventEndDay, '23:59') ?? undefined;
          } else {
            // Otherwise, if reminder is same-day, end time is same as start time
            return convertTimeAndDateToTimestamp(reminder.date, startString) ?? undefined;
          }
        }
      }
    }

    // Neither of the times have set values, return undefined, treat as empty
    return undefined;
  };


    // Flight
    switch (reminder.eventType) {
      case 1: {
        const flightFields = 
        FieldsToFlight(
          extensionString('depAirportName'),
          extensionString('depAirportAddress'),
          extensionString('arrAirportName'),
          extensionString('arrAirportAddress'),
          extensionString('airlineCode'),
          extensionString('flightNumber'),
          extensionString('airlineName'),
          extensionString('depAirportIATA'),
          undefined, // depTimezoneAbbr
          extensionTime('depTime'),
          undefined, // depTimeDestZone
          extensionTime('boardingTime'),
          extensionString('boardingGroup'),
          extensionString('gate'),
          undefined, // depTimezoneOffset
          undefined, // arrTimeZoneOffset
          extensionString('arrAirportIATA'),
          undefined, // arrTimezoneAbbr
          extensionTime('arrTime'),
          undefined // arrTimeDestZone
      );
      // Make sure the built UI fields are validated - not past max length, undefined, or null terminators
      const validateFields = ValidateFlight(flightFields);
      // Check if validateFlight returned a success or error string
      if (typeof validateFields === 'string' && validateFields !== '') {
        // Do not save/progress if validation failed
        return [];
      } 

      // Fields are provided and validated, build extension to save
      const exts = FlightToExtensions(flightFields) ?? [];
      // console.log('PACKER final packed extensions (to be saved):', exts);
      return exts;
    }
      // Hotel
      case 2: {
      const hotelFields = 
      FieldsToHotel(
        extensionString('name'),
        extensionString('address'),
        extensionTime('checkinTime'),
        extensionTime('checkoutTime'),
        undefined, // timezoneAbbrev
        undefined, // timezoneOffset
        extensionString('roomNumber')
      );
       // Make sure the built UI fields are validated - not past max length, undefined, or null terminators
      const validateFields = ValidateHotel(hotelFields);
      // Check if validateFlight returned a success or error string
      if (typeof validateFields === 'string' && validateFields !== '') {
        // Do not save/progress if validation failed
        return [];
      } 
      // Fields are provided and validated, build extension to save
      return HotelToExtensions(hotelFields) ?? [];
    }
      default: {
        // No extension fields for other event types (generic = 0)
        return [];
      }
    }
  }

// Map event types to format for q-select dropdown menu
const eventTypeOptions = computed(() => {
  return eventTypes.map(eventType => ({
    label: eventType.name,
    value: eventType.id
  }));
});

const showSettings = ref(false);
const showLoginOptions = ref(false);
const showChangeLogin = ref(false);
const isCloudOn = ref(false);
const isSyncing = ref(false);
const syncStatusMessage = ref('Cloud Not Synced')

// Function to handle toggling cloud sync on/off
async function onToggleCloudSync() {
  if (!isCloudOn.value) {
    return;
  }

  // If already syncing, dont start another sync
  if (isSyncing.value) {
    return;
  }

  // Was not syncing, start sync
  isSyncing.value = true;
  syncStatusMessage.value = 'Syncing...';

  try {
    await window.syncAPI.sync();
    syncStatusMessage.value = 'Cloud Synced Successfully';
    console.log('Cloud sync completed successfully');
  } catch (error) {
    syncStatusMessage.value = 'Cloud Sync Failed';
    console.error('Error during cloud sync:', error);
   // Incase of error, reset sync status
  } finally {
    isSyncing.value = false;
  }
}

// Change icon depending on cloud sync status
const cloudIcon = computed(() => {
  // Cloud toggle is off
  if (!isCloudOn.value) {
    return 'cloud_off'
  }
  // Currently syncing
  if (isSyncing.value) {
    return 'cloud_sync'
  }
  // Sync successful
  if (syncStatusMessage.value === 'Cloud Synced Successfully') {
    return 'cloud_done'
  }
  // Sync failed
  if (syncStatusMessage.value === 'Cloud Sync Failed') {
    return 'cloud_off'
  }
  // Default
  return 'cloud'
})

const selectAll = ref(false)
const searchQuery = ref('');
const newUsername = ref<string>('');
const newPassword = ref<string>('');
const isPwd = ref(true);
const $q = useQuasar();
const router = useRouter();

// Specific folder ID currently selected in the file explorer tree, tracked for adding folder in that specific spot
// null is if there is no folder selected on the tree, this by default
const selectedFolderID = ref<bigint | null>(null);
const folders = ref<UIFolder[]>([]);

// Map folders to format for q-select dropdown menu
// Each option has a label (name of the option/folder in the dropdown) and a value (actual folder to save note into)
// Computed so it automatically updates whenever folders array updates (if new folder is added it shows up in the options)
const folderDropdownOptions = computed(() => {
  return folders.value.map(folder => ({
    label: folder.folderName,
    value: folder.folderID
  }));
});


// Function to get reminder by its ID
function getReminder(id?: bigint | null): UIReminder | null {
  const reminderID = id ?? selectedFolderID.value;
  // No tree node selected
  if (reminderID === null) {
    return null;
  }
  const treeReminderID = -reminderID;
  return reminders.value.find(reminder => String(reminder.itemID) === String(treeReminderID)) ?? null;
}

// Function to get note by its ID
function getNote(id?: bigint | null): UINote | null {
  const noteID = id ?? selectedFolderID.value;
  if (noteID === null) {
    return null;
  }
  const treeNoteID = -noteID;
  return notes.value.find(note => String(note.itemID) === String(treeNoteID)) ?? null;
}

// Function to get folder by its ID
// getFolder() returns UI folder object for currently selected folder in tree
// getFolder(ID) returns UI folder for a specific node ID
// When rendering tree nodes, check isEditing property of the UIFolder to see if it should show q-input
function getFolder(id?: bigint | null): UIFolder | null {
  const folderID = id ?? selectedFolderID.value;
  if (folderID === null) {
    return null;
  }
  return folders.value.find(folder => String(folder.folderID) === String(folderID)) ?? null;
}

// Function to handle selection changes in file explorer tree
// Prevents changing selected node while editing so input box stays focused
function handleTreeSelection(newlySelectedNode: bigint | null) {
  // If any node is being edited, do not change selected node until editing is done
  const nodeBeingEdited = folders.value.some(folder => folder.isEditing) ||
                        reminders.value.some(reminder => reminder.isEditing) ||
                        notes.value.some(note => note.isEditing);
  if (nodeBeingEdited) {
    return;
  }
  // Otherwise, allow selection to other nodes like normal
  else {
    selectedFolderID.value = newlySelectedNode;

    // If individual reminder or note (negative ID) is selected, navigate to its expanded view in list
    if (newlySelectedNode !== null && newlySelectedNode < 0n) {
      const itemID = -newlySelectedNode;

      const reminder = reminders.value.find(reminder => String(reminder.itemID) === String(itemID));
      // Node is a reminder
      if (reminder) {
        // Switch to reminder tab
        tab.value='reminders';
        // Set date to reminder date on calendar
        selectedDate.value = reminder.date;
        // Collapse all other reminders except the selected entry
        reminders.value.forEach(reminder =>  {reminder.expanded = false; })
        // Expand the selected reminder card 
        reminder.expanded = true;
        return;
      }
      // Node is a note
      const note = notes.value.find(note => String(note.itemID) === String(itemID));
      if (note) {
        tab.value='notes';
        // Collapse all other notes except the selected entry
        notes.value.forEach(note =>  {note.expanded = false; })
        // Expand the selected note card
        note.expanded = true;
        return;
      }
    }
  }
}

// When rename button is clicked, set isEditing (q-input field) to appear for tree node
// On enter when editing, folder is renamed
function renameTreeNode() {
  const selectedTreeNode  = selectedFolderID.value
  if (selectedTreeNode === null) {
    return;
  }
  // Positive ID, rename a folder
  if (selectedTreeNode >= 0n) {
    const folder = getFolder(selectedTreeNode);
    if (folder) {
        // Show input box
        folder.isEditing = true;
        // Set temporary name displayed in tree to written name
        folder.temporaryFolderName = folder.folderName;
        selectedFolderID.value = folder.folderID;
    }
  }
  // Negative ID, rename a reminder or note
  else {
    const reminder = getReminder(selectedTreeNode);
    if (reminder) {
        reminder.isEditing = true;
        reminder.temporaryTitle = reminder.title;
        selectedFolderID.value = -reminder.itemID;
    }
    const note = getNote(selectedTreeNode);
    if (note) {
        note.isEditing = true;
        note.temporaryTitle = note.title;
        selectedFolderID.value = -note.itemID;
    }
  }
}

// On escape when editing, cancel rename and revert back to original name
function cancelRename(item: UIReminder | UINote | UIFolder) {
  if (!item) return;

  // Distinguish between folder and reminder/note by checking for unique property
  // Rename a folder
  if ('temporaryFolderName' in item) {
    item.isEditing = false;
    item.temporaryFolderName = item.folderName;
    item.folderNameError = '';
    return;
  } 
  // Rename a reminder
  else if ('temporaryEventStartTime' in item) {
    item.isEditing = false;
    item.temporaryTitle = item.title ?? '';
    item.titleMessageError = '';
    return;
  }
  // Rename a note
  else if ('temporaryText' in item) {
    item.isEditing = false;
    item.temporaryTitle = item.title ?? '';
    item.titleMessageError = '';
    return;
  }
}

// Convert nested folder tree to Q-Tree format
// Computed since it relies on nestedFolderTree, so it automatically updates whenever the nested folder tree updates
const qNestedTree = computed(() => buildRootNodes(folders.value, notes.value, reminders.value));

// Computed breadcrumbs array that walks from the selected folder up to the root to build the path
const breadcrumbs = computed(() => buildBreadcrumbs(selectedFolderID.value, folders.value, notes.value, reminders.value))

// Click a breadcrumb name to select that folder in the tree
// Reactive so whenever selected folder ID changes, breadcrumb path will be ran and recomputed automatically
function selectBreadcrumbItem(folderID : bigint) {
  selectedFolderID.value = folderID;
}

// temp id generator for UI-only drafts (negative IDs)
// Negative ID for temp objects from: https://stackoverflow.com/questions/53850790/how-to-work-with-unsaved-entities-even-though-id-attribute-is-needed
let tempIDCounter = -2n;
// Function to add a reminder to the list on the specified calendar date
function addReminder() {
  // create a UI-only draft reminder with a temporary negative bigint ID
  const tempID = tempIDCounter--;
  // Folder to save reminder in is either root by default if nothing is selected, otherwise selected folder in tree
  const folderID = selectedFolderID.value ?? 0n;

  const draft: UIReminder = {
    itemID: tempID,
    folderID: folderID,
    eventType: 0,
    extension: {} as Record<string, string | number | null | undefined>,
    title: '',
    // Draft has no notification
    temporaryNotificationTime: null,
    temporaryEventStartTime: '',
    temporaryEventEndTime: '',
    temporaryEventEndDay: '',
    temporaryLastModified: new Date().toLocaleString(),
    temporaryTitle: '',
    temporaryFolderID: folderID,
    date: selectedDate.value,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: false, // Draft - first time hitting add creates a draft reminder not yet saved
    isEditing: false,
    isSelected: false,
    expanded: true,
    temporaryEventEndDateEnabled: false
  } as UIReminder;

  // Add draft reminder to reminders array for UI rendering
  reminders.value.push(draft);
  // Close other reminders when a new one is added
  reminders.value.forEach((reminder, index) => {
    if (index < reminders.value.length - 1) {
      reminder.expanded = false
    }
  })
}

// Function to display reminders for selected calendar date
async function loadRemindersForCalendarDate(dateString: string) {
  // Compute timestamp for start and end of selected date/day, '' is treated as 00:00 in helper
  const startOfDay = convertTimeAndDateToTimestamp(dateString, '');
  const endOfDay = convertTimeAndDateToTimestamp(dateString, '23:59');

  try {
    // Filter out any reminders already in list for that date to avoid duplicates
    reminders.value = reminders.value.filter(reminder => reminder.date !== dateString);
    // Read reminders for currently selected date from local DB
    const rows = await readRemindersInRange(startOfDay, endOfDay);
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of rows) {
      mapDBToUIReminder(reminder, true);
    }
    // console.log('Reminders for date loaded successfully:');
  } catch (error) {
    console.error('Error loading reminders for date:', error);
  }
}

// Function to display reminders for selected month on calendar
// Pass in calendar string YYYY-MM-DD
async function loadRemindersForMonth(dateString: string) {
  // Split date string by delimiter '-' to get each part (year, month, day)
  const [yearString, monthString, dayString] = dateString.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  // Check for invalid month
  if (month < 1 || month > 12) {
    console.error('Invalid month value:', month);
    return;
  }

  // Check for invalid day
  if (day < 1 || day > 31) {
    console.error('Invalid day value:', day);
    return;
  }

  // Check for invalid year
  if (year < 1) {
    console.error('Invalid year value:', year);
    return;
  }

  // Build start and end timestamps to load in range (from first day to last day of month)
  // First day of the month - ex. 2025-11-01
  const startDayOfMonth= `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day of the month - ex. 2025-11-30
  // Date returns the day before the first day of the next month (always the last day - ex. 30 for Nov, 31 for Dec, 28 for Feb)
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const lastDayString = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  // Convert to qcalendar timestamps
  const startRange = convertTimeAndDateToTimestamp(startDayOfMonth, '');
  const endRange = convertTimeAndDateToTimestamp(lastDayString, '23:59');

  try {
    // Reload monthReminders for calendar 
    monthReminders.value = [];
    const rows = await readRemindersInRange(startRange, endRange);
    const requestedYM = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}`;
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of rows) {
      // Update reminders list
      const result = mapDBToUIReminder(reminder, false);
      // Extra check to only include items whos month match the calendar month
        if (result.date && result.date.startsWith(requestedYM)) {
          // push into monthReminders so the calendar uses these events
          monthReminders.value.push(result);
        }
        // console.log('Reminders for month successfully loaded:');
      }
    } catch (error) {
    console.error('Error loading reminders for month:', error);
  } 
}

// grabs all reminders created from the provided year, the previous and the next year
// if no year is provided, uses the current year
async function loadReminders(year?: number) {
  if (year == undefined) year = new Date().getFullYear();
  const currentYear = year;
  const lastYear = (currentYear == 1) ? -1 : currentYear - 1;
  const nextYear = (currentYear == -1) ? 1 : currentYear + 1;
  const start = convertTimeAndDateToTimestamp(lastYear.toString() + '-01-01', '');
  const end = convertTimeAndDateToTimestamp(nextYear.toString() + '-12-31', '23:59');
  try {
    // clear list before reloading
    reminders.value = [];
    const rows = await readRemindersInRange(start, end);
    // convert each note in range from response to UI note format
    for (const reminder of rows) {
      mapDBToUIReminder(reminder, true);
    }
    // sort reminders alphabetically by title for tree 
    reminders.value.sort((a, b) => {return String(a.temporaryTitle ?? a.title ?? '').toLowerCase().localeCompare(String(b.temporaryTitle ?? b.title ?? '').toLowerCase());});
    // console.log('All reminders loaded successfully:');
  } catch (error) {
    console.error('Error loading reminders:', error);
  }
}

// Function to add a note to the list
function addNote() {
  // create a UI-only draft note with a temporary negative bigint ID
  const tempID = tempIDCounter--;
   // Folder to save note in is either root by default if nothing is selected, otherwise selected folder in tree
  const folderID = selectedFolderID.value ?? 0n;

   const draft: UINote = {
    itemID: tempID,
    folderID: folderID,
    title: '',
    temporaryTitle: '',
    temporaryFolderID: folderID,
    temporaryLastModified: new Date().toLocaleString(),
    text: '',
    temporaryText: '',
    date: selectedDate.value,
    titleMessageError: '',
    folderMessageError: '',
    isSaved: false, 
    expanded: true,
    isSelected: false
  } as UINote;

  // Add draft note to notes array for UI rendering
  notes.value.push(draft);
  // Close other notes when a new one is added
  notes.value.forEach((note, index) => {
    if (index < notes.value.length - 1) {
      note.expanded = false
    }
  })
}

// Root folder should always exist
async function addRootFolder() {
  try {
    // Try to load existing folders from local db
    const folders = mapDBToUIFolder(await readAllFolders());
    // If no root folder exists (no folders with parentFolderID === -1), create one
    const hasRootFolder = folders.some(folder => folder.parentFolderID === -1n || folder.folderID === 0n);
    if (!hasRootFolder) {
      await createRootFolder(-1);
      console.log('Root folder created.', folders);
      // Refresh folder list after creating root folder
      await readAllFolders();
    }
    else {
      // Root folder already exists
      //console.log('Root folder already exists.');
    }
  }
  catch (error) {
    console.error('Error adding root folder:', error);
  }
}

// Remove padding null characters from extension strings received by database for UI display
function stripNulls(fieldString?: string | null): string {
  // Globally replace all null characters with empty string and trim whitespace
  return (fieldString ?? '').replace(/\0/g, '').trim();
}

// Map a DB reminder row into the UI reminder shape needed for card display
// Additional upsert parameter decides whether to add/update the global reminders array
function mapDBToUIReminder(row: Reminder, upsert: boolean): UIReminder {
  // Create a date in local timezone from DB row for UI so filtered reminder/note list only shows entries whose event date match the calendar date
  // Get minute of day, event day, and event year from DB row
  const minuteOfDay = Number(row.eventStartMin);
  const eventDay = Number(row.eventStartDay);
  const eventYear = Number(row.eventStartYear);
  // Start at january 1st of event year and add days to get the right month/day. 
  const date = new Date(eventYear, 0, 1);
  // Set date object to event day
  date.setDate(date.getDate() + (eventDay - 1));
  // Calculate hours: divide number of minutes by 60 to get hours
  // Floor to return actual integer hour, no decimals
  const eventHour = Math.floor(minuteOfDay / 60);
  // Calculate remaining minutes: take minutes and modulo 60 (remainder is number of minutes)
  const eventMinute = minuteOfDay % 60;
  // Set hours and minutes of date object
  date.setHours(eventHour, eventMinute, 0, 0);
  // Convert date to YYYY-MM-DD string format compatible with qcalendar/selectedDate
  // getMonth returns zero-based index add 1 to get actual month number
  // Pad month and day so its always two digits - ex. day 5 becomes 05
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const endMinuteOfDay = Number(row.eventEndMin);
  const endEventDay = Number(row.eventEndDay);
  const endEventYear = Number(row.eventEndYear);
  const endDate = new Date(endEventYear, 0, 1);
  endDate.setDate(endDate.getDate() + (endEventDay - 1));
  const eventEndHour = Math.floor(endMinuteOfDay / 60);
  const eventEndMinute = endMinuteOfDay % 60;
  endDate.setHours(eventEndHour, eventEndMinute, 0, 0);
  const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const startEpoch = date.getTime();
  const endEpoch = endDate.getTime();

  // If end day is different calendar day from start day, and end time moment is after start time moment, multi-day event has occured
   const isMultiDayEvent = (endDateString !== dateString) && (endEpoch > startEpoch);

  // Get last modified and convert for display
  const lastModifiedEpoch = Number(row.lastModified);
  const reminderDate = new Date(lastModifiedEpoch);
  // YYYY-MM-DD string format compatible with qcalendar/selectedDate
  // getMonth returns zero-based index so add 1 to get actual month number
  const lastModifiedTimeAndDate = reminderDate.toLocaleString();

  // UI reminder extension fields as a record, these are the actual values taken from frontend input fields 
  const extensionsUI = {} as Record<string, string | number | null | undefined>;

  // DB reminder row with extensions
  const extensionsArr = (row as Reminder & { extensions?: Extension[] }).extensions;

  // Derive HH:MM time strings for display from database stored minutes of day value
  // Convert event start and end min into HH:MM string
  let startStr = (typeof row.eventStartMin === 'number') ? minutesToHHMM(row.eventStartMin) : '';
  let endStr = (typeof row.eventEndMin === 'number') ? minutesToHHMM(row.eventEndMin) : '';

  if (!startStr) {
    startStr = '';
  }
  if (!endStr) {
    endStr = '';
  }

  const eventStartMin = typeof row.eventStartMin === 'number' ? row.eventStartMin : null;
  const notifMin = typeof row.notifMin === 'number' ? row.notifMin : null;
  // Compute dropdown remind me option (ex. 5 mins before event time)
  const minutesBeforeStartTime = (row.hasNotif === 1 && eventStartMin != null && notifMin != null) ? eventStartMin - notifMin : null;

  // If extensions array exists, map each extension into extensions UI record
  if (extensionsArr && extensionsArr.length > 0) {
    // If a flight, extract flight fields
    if (row.eventType === 1) {
      const flightFields = ExtensionsToFlight(extensionsArr);
      console.log('flightFields', flightFields, 'extensionsUI', extensionsUI);
      if (flightFields) {
        extensionsUI.depAirportName = stripNulls(flightFields.depAirportName ?? '');
        extensionsUI.depAirportAddress = stripNulls(flightFields.depAirportAddress ?? '');
        extensionsUI.arrAirportName = stripNulls(flightFields.arrAirportName ?? '');
        extensionsUI.arrAirportAddress = stripNulls(flightFields.arrAirportAddress ?? '');
        extensionsUI.airlineCode = stripNulls(flightFields.airlineCode ?? '');
        extensionsUI.flightNumber = stripNulls(flightFields.flightNumber ?? '');
        extensionsUI.airlineName = stripNulls(flightFields.airlineName ?? '');
        extensionsUI.depAirportIATA = stripNulls(flightFields.depAirportIATA ?? '');
        extensionsUI.depTime = minutesToHHMM(flightFields.depTimeMin);
        extensionsUI.boardingTime = minutesToHHMM(flightFields.boardingTimeMin);
        extensionsUI.boardingGroup = stripNulls(flightFields.boardingGroup ?? '');
        extensionsUI.gate = stripNulls(flightFields.gate ?? '');
        extensionsUI.arrAirportIATA = stripNulls(flightFields.arrAirportIATA ?? '');
        extensionsUI.arrTime = minutesToHHMM(flightFields.arrTimeMin);
      }
    }
    // If a hotel, extract hotel fields
    else if (row.eventType === 2) {
      const hotelFields = ExtensionsToHotel(extensionsArr);
      if (hotelFields) {
        extensionsUI.name = stripNulls(hotelFields.name ?? '');
        extensionsUI.address = stripNulls(hotelFields.address ?? '');
        extensionsUI.checkinTime = minutesToHHMM(hotelFields.checkinTimeMin);
        extensionsUI.checkoutTime = minutesToHHMM(hotelFields.checkoutTimeMin);
        extensionsUI.roomNumber = stripNulls(hotelFields.roomNumber ?? '');
    }
  }
}

 // Need to add fields to the DB reminder row specific to the UI card
 // Sets temporary fields to saved values from DB
  const UIReminder = {
    // Copy all fields from DB shared type 
    ...row,
    // normalize itemID and folder IDs to bigint so they match folder IDs used by the tree
    itemID: (typeof row.itemID === 'bigint') ? row.itemID : BigInt(row.itemID),
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    temporaryFolderID: row.folderID == null ? null : ((typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID)),
    // Add on UI specific fields
    temporaryTitle: row.title ?? '',
    // Replace this with actual extension fields later when support is added
    extension: extensionsUI,
    temporaryEventStartTime: startStr,
    temporaryEventEndTime: endStr,
    temporaryEventEndDay: normalizeDatePickerToCalendar(endDateString) ?? dateString, // Default end day is same as start day (not multi-day)
    temporaryEventEndDateEnabled: isMultiDayEvent, // Default not multi-day event
    // If theres a notification, temporary notification time is reminder notification minute of day 
    temporaryNotificationTime: minutesBeforeStartTime,
    temporaryLastModified: lastModifiedTimeAndDate,
    date: normalizeDatePickerToCalendar(dateString) ?? dateString,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    expanded: true,
  } as UIReminder;

  // If true, update (if existing) or insert (if not) UI reminder into global reminders array
  if (upsert) {
    // Compute index for a reminder for card display, use itemID as unique index
    // Look for existing reminder in reminders array that matches the itemID of the converted reminder
    const index = reminders.value.findIndex(reminder => String(reminder.itemID) === String(UIReminder.itemID));
    if (index >= 0) {
    // If found, replace preexisting reminder in array with new UI object
    reminders.value[index] = UIReminder;
  } else {
    // If not found, add new UI object reminder to the array
    reminders.value.push(UIReminder);
  }
}
  return UIReminder;
}
function colorCodeToHex(code: number): string {
  return '#' + Number(code).toString(16).padStart(6, '0');
}

// Map a DB folder row into the UI folder shape
function mapDBToUIFolder(rows: Folder[]): UIFolder[] {
 const row = (rows ?? []).map(row => ({
    // Copy all fields for a folder from DB row
    ...row,
    temporaryFolderName: row.folderName ?? '',
    folderNameError: '',
    // If folderID is already a bigint, return it. Otherwise, cast value to a bigint
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    parentFolderID: (typeof row.parentFolderID === 'bigint') ? row.parentFolderID : BigInt(row.parentFolderID),
    lastModified: (typeof row.lastModified === 'bigint') ? row.lastModified : BigInt(row.lastModified),
    isSaved: true,
    isEditing: false,
    colorCode: Number(row.colorCode ?? convertHexToInt('#459dd8')),        // existing DB numeric field
  })) as UIFolder[];

  // How to sort alphabetically: https://stackoverflow.com/questions/6712034/sort-array-by-firstname-alphabetically-in-javascript
  // Sort folder names alphabetically in folder array
  // Normalize to lowercase so the sorting is case-insensitive
  row.sort((a, b) => String(a.folderName ?? '').toLowerCase().localeCompare(String(b.folderName ?? '').toLowerCase()));
  return row;
}

// Function to map a DB note row into the UI note shape needed for card display
function mapDBToUINote(row: Note, upsert: boolean): UINote {
  // Create a date from the lastModified timestamp for UI
  // cast to number for date operations
  const lastModifiedEpoch = Number(row.lastModified);
  const noteDate = new Date(lastModifiedEpoch);
  // YYYY-MM-DD string format compatible with qcalendar/selectedDate
  // getMonth returns zero-based index so add 1 to get actual month number
  const dateString = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}-${String(noteDate.getDate()).padStart(2, '0')}`;
  // For display
  const lastModifiedTimeAndDate = noteDate.toLocaleString();

  // Need to add fields to the DB note row specific to the UI card
  // Sets temporary fields to saved values from DB
  const UINote = {
    // Copy all fields from DB shared type 
    ...row,
    itemID: (typeof row.itemID === 'bigint') ? row.itemID : BigInt(row.itemID),
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    temporaryFolderID: row.folderID == null ? null : ((typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID)),
    temporaryTitle: row.title ?? '',
    temporaryText: row.text ?? '',
    date: dateString,
    temporaryLastModified: lastModifiedTimeAndDate,
    titleMessageError: '',
    folderMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    expanded: true,
  } as UINote;

  if (upsert) {
    // Compute index for a note for card display, use itemID as unique index
    // Look for existing note in notes array that matches the itemID of the newly created note
    const index = notes.value.findIndex(note => String(note.itemID) === String(UINote.itemID));
  if (index >= 0) {
    // If found, replace preexisting note in array with new UI object
    notes.value[index] = UINote;
  } else {
    // If not found, add new UI object note to the array
    notes.value.push(UINote);
  }
}

  return UINote;
}

// grabs all notes created from the provided year, the previous and the next year
// if no year is provided, uses the current year
async function loadNotes(year?: number) {
  if (year == undefined) year = new Date().getFullYear();
  const currentYear = year;
  const lastYear = (currentYear == 1) ? -1 : currentYear - 1;
  const nextYear = (currentYear == -1) ? 1 : currentYear + 1;
  const start = convertTimeAndDateToTimestamp(lastYear.toString() + '-01-01', '');
  const end = convertTimeAndDateToTimestamp(nextYear.toString() + '-12-31', '23:59');
  try {
    // clear list before reloading
    notes.value = [];
    const rows = await readNotesInRange(start, end);
    // convert each note in range from response to UI note format
    for (const note of rows) {
      mapDBToUINote(note, true);
    }
    // sort notes alphabetically by title for tree
    notes.value.sort((a, b) => {
      return String(a.temporaryTitle ?? a.title ?? '').toLowerCase().localeCompare(String(b.temporaryTitle ?? b.title ?? '').toLowerCase());
    });
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

onMounted(async () => {
  // Add root folder if no folders exist on page load
  await addRootFolder();
  // Ensure folders array is populated from local DB on page load
  folders.value = mapDBToUIFolder(await readAllFolders());
  // Load all reminders and notes so tree shows every item
  await loadReminders();
  await loadNotes();
  // Load reminders for selected calendar date on startup for tab list
  await loadRemindersForCalendarDate(selectedDate.value);
  // Load reminders for the visible month for calendar events
  await loadRemindersForMonth(selectedDate.value);
  // Since sync initiates on startup, set cloud toggle to on
  isCloudOn.value = true;
  // Start initial sync on app load
  await onToggleCloudSync();
  });

// Function to add a folder to the tree
function addFolder() {
   // create a UI-only draft folder with a temporary negative bigint ID
  const tempID = tempIDCounter--;
  // Sets parentFolderID of new folder to currently selected folder in file explorer tree. If no folder is selected, add new folder to root (parentFolderID = 0)
  const newParentFolderID = normalizeFolderID(selectedFolderID.value, notes.value, reminders.value, folders.value) ?? 0n;

  const draft: UIFolder = {
    folderID: tempID,
    parentFolderID: newParentFolderID,
    folderName: 'New Folder',
    folderNameError: '',
    temporaryFolderName: 'New Folder',
    isSaved: false,
    isEditing: true, // When new draft is added, automatically in editing mode to name it
    colorCode:-1, // Default folder color
  } as UIFolder;

  
  // Add draft folder to folders array for UI rendering
  folders.value.push(draft);
  // Select newly added folder
  selectedFolderID.value = tempID;
}


// Function to save folder after user hits enter
async function saveFolder(folder: UIFolder){
  // If folder name (with whitespace removed) is empty, show error message and disable save button
  if (!folder.temporaryFolderName.trim()) {
    folder.folderNameError = 'Folder name cannot be empty.';
    return;
  }

 // Folder name cannot be more than 24 characters (to match schema)
  if (String(folder.temporaryFolderName).trim().length > 24) {
    folder.folderNameError = 'Folder name cannot exceed 24 characters.';
    return;
  }

  // Normalize candidate parent ID (in case of drafts parent ID could be undefined)
  const candidateParentID: bigint = folder.parentFolderID ?? selectedFolderID.value ?? 0n;
  const normalizeParentFolderID: bigint = normalizeFolderID(candidateParentID, notes.value, reminders.value, folders.value) ?? 0n;

  // Check that parentFolderID exists when creating a folder
  // Check for a folder with the parent folder ID exists in the folders array (or 0 for root)
  const parentFolderExists = candidateParentID === 0n || folders.value.some(folder => String(folder.folderID) === String(candidateParentID));

  if (!parentFolderExists) {
    return;
  }

  // Extra check to prevent setting a folder as its own parent (can cause recursive loop issues)
  if (folder.isSaved && String(folder.folderID) === String(candidateParentID)) {
    folder.folderNameError = 'Folder cannot be its own parent.';
    return;
  }

  try {
    // First time is a draft folder, create new folder in local DB
    if (!folder.isSaved) {
      const folderID: bigint = await createFolder(normalizeParentFolderID, -1, folder.temporaryFolderName);
      folders.value = mapDBToUIFolder(await readAllFolders());
      selectedFolderID.value = folderID;
    }
    // Anytime afterwards, update preexisting folder
    else {
      await updateFolder(folder.folderID, normalizeParentFolderID, -1, folder.temporaryFolderName);
      folders.value = mapDBToUIFolder(await readAllFolders());
    }
  }
  catch (error) {
    console.error('Error adding folder:', error);
  }
}

// Function to save note fields when save button is clicked
async function saveNote(note: UINote){
  // If note title (with whitespace removed) is empty, show error message and disable save button
    if (!note.temporaryTitle.trim()) {
    note.titleMessageError = 'Note title cannot be empty.';
    return;
  }
   // Title field can be no greater than 48 characters
  if (note.temporaryTitle.length > 48) {
    note.titleMessageError = 'Note title cannot exceed 48 characters.';
    return;
  }
   // Folder must exist 
   // Checks if folder id (temporary folder) matches any existing folder ids in folders array
  if (note.temporaryFolderID == null || !folders.value.some(folder => String(folder.folderID) === String(note.temporaryFolderID))) {
    note.folderMessageError = 'Note must be in a existing folder';
    return;
  }

 try {
  if (!note.isSaved) {
    const itemID = await createNote(note.temporaryFolderID, note.temporaryTitle, note.temporaryText);
    console.log('Note successfully created:', itemID);

    // Give this new note the actual itemID assigned by the DB and mark it saved so future saves go to update
    note.itemID = itemID;

    // Map DB row into UI and update notes.value array
    const row = await readNote(note.itemID); 
    if (row) {
      mapDBToUINote(row, true);
    } 
    // Refresh folders to show newly added note in file explorer tree
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Reload notes to include newly added note
    await loadNotes();
  }
  else {
      await updateNote(note.itemID, note.temporaryFolderID, note.temporaryTitle, note.temporaryText);
      console.log('Note successfully updated:', note.itemID);

      // Map DB row into UI and update notes.value array
      const row = await readNote(note.itemID); 
      if (row) {
        mapDBToUINote(row, true);
      } 

      // Reload folders to see updated note in file tree
      folders.value = mapDBToUIFolder(await readAllFolders());
      // Reload notes to see updated note card
      await loadNotes();
  }
 } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Function to save reminder fields when save button is clicked
async function saveReminder(reminder: UIReminder){
  // If reminder title (with whitespace removed) is empty, show error message and disable save button
  if (!reminder.temporaryTitle.trim()) {
    reminder.titleMessageError = 'Reminder title cannot be empty.';
    return;
  }
  // Title field can be no greater than 48 characters
  if (reminder.temporaryTitle.length > 48) {
    reminder.titleMessageError = 'Reminder title cannot exceed 48 characters.';
    return;
  }
  // eventType must be integer value 
  if (typeof reminder.eventType !== 'number' || !Number.isInteger(reminder.eventType)) {
    reminder.titleMessageError = 'Invalid event type selected.';
    return;
  }
  // Folder must exist
  // Checks if folder id (temporary folder) matches any existing folder ids in folders array
  if (reminder.temporaryFolderID == null || !folders.value.some(folder => String(folder.folderID) === String(reminder.temporaryFolderID))) {
    reminder.folderMessageError = 'Reminder must be in a existing folder';
    return;
  }
  
  const extension = reminder.extension ?? {};

  // Helper function to safely read string/time fields from extension record (as they are optional they can be missing or empty)
  const extensionString = (fieldKey: string): string | undefined => {
    // Lookup fields raw value from extension record by its key (ex. reminder.extension.airlineName)
    const fieldRawValue = extension[fieldKey];
    // If the field is missing (undefined), it has no value
    if (fieldRawValue === undefined || fieldRawValue === null) {
      return undefined;
    }
    // If the field exists, cast its value to string and trim whitespace
    const fieldString = String(fieldRawValue).trim();
    return fieldString === '' ? undefined : fieldString;
  };


  let startTimeStr = '';
  let endTimeStr = '';

  // Determine date/end time from the source
  // Flight
  if (reminder.eventType === 1) { 
    // Lookup extension fields to see if they exist, if it does, use these for start and end time
    startTimeStr = extensionString('depTime') ?? '';
    endTimeStr = extensionString('arrTime') ?? '';
    // Hotel
  } else if (reminder.eventType === 2) { 
    startTimeStr = extensionString('checkinTime') ?? '';
    endTimeStr = extensionString('checkoutTime') ?? '';
  }
  // If not an event type (generic reminder), just use temporary start and end time as normal
  else {
      // Cast times into strings (since extension fields can be multiple types)
      startTimeStr = String(reminder.temporaryEventStartTime ?? '').trim();
      endTimeStr = String(reminder.temporaryEventEndTime ?? '').trim();
  }

  // Do not allow event end time without a start time
  if (startTimeStr === '' && endTimeStr !== '') {
    reminder.timeMessageError = 'Start time is required when setting an end time.';
    return;
  }

  // If user sets a notification (non-null), they must have a start time
  if (reminder.temporaryNotificationTime != null && startTimeStr === '') {
    reminder.timeMessageError = 'Start time is required when setting a notification.';
    return;
  }

  // Otherwise if no notification is set and user doesn't provide a start time, use placeholder 00:00 midnight timestamp
  const startTime = startTimeStr === '' ? '00:00' : startTimeStr;

  // Event start time is day of event + inputted user time - or 00:00 placeholder if none provided
  const eventStartTime = convertTimeAndDateToTimestamp(reminder.date, startTime);

  if (!eventStartTime) {
    reminder.timeMessageError = 'Invalid start time.';
    return;
  }

  const eventStartDay = normalizeDatePickerToCalendar(reminder.date) ?? reminder.date;
 // If multi-day event is enabled, use end day user provided, if single day, use start date (reminder.date)
  const eventEndDay = reminder.temporaryEventEndDateEnabled
  // Uses end day from calendar picker in format YYYY-MM-DD (extra validation)
  ? (normalizeDatePickerToCalendar(reminder.temporaryEventEndDay)) : eventStartDay;

  // If multi-day event is enabled, end day must be provided
  if (reminder.temporaryEventEndDateEnabled) {
    if (!eventEndDay) {
      reminder.timeMessageError = 'Please select a valid event end date for multi‑day events.';
      return;
    }
  }

  // If multi-day event and no end time selected (''), end time is end of that day (23:59), otherwise its the end time provided
  // Otherwise, if single day event and no time selected (''), event end time is same as as start time , otherwise its the end time provided
  const eventEndTime = reminder.temporaryEventEndDateEnabled
  ? (endTimeStr === '' ? '23:59' : endTimeStr)
  : (endTimeStr === '' ? startTime : endTimeStr);

  // Create timestamp from event end day + time (or just time)
  // Takes event end day (ex. YYYY-MM DD and time HH:MM) and converts to qcalendar timestamp)
  const eventEnd = convertTimeAndDateToTimestamp(eventEndDay, eventEndTime);

    if (!eventEnd) {
      reminder.timeMessageError = 'Invalid end time.'
      return;
    }

    // Compare exact moment in time if event start time is before event end time, if not, error
    const startEpoch = timeStamptoEpoch(eventStartTime);
    const endEpoch = timeStamptoEpoch(eventEnd);
    if (endEpoch < startEpoch) {
      reminder.timeMessageError = 'Start time must be before end time.';
      return;
    }

  // If no notification time selected (never), return null. Otherwise, convert time into timestamp
  const notifTime = reminder.temporaryNotificationTime == null ? null : convertNotificationTimestamp(eventStartDay, startTime, reminder.temporaryNotificationTime);

  // Check notification time is before or at event start time if provided
  if (notifTime && timeStamptoEpoch(notifTime) > timeStamptoEpoch(eventStartTime)) {
    reminder.timeMessageError = 'Notification must be at or before event start time.'
    return;
  }
  // Toggle hasNotif based on whether notification time is selected or not. If notifTime is null, hasNotif is false since theres no notification
  const hasNotification = notifTime != null;
  // Send placeholder timestamp (event start time) to backend if never notification/null for safety since backend expects a timestamp
  // Backend should ignore notifTime if hasNotif is false (theres no notification)
  const notificationTimestampToSend = notifTime ?? eventStartTime;
  // Clear any error messages, time has passed
  reminder.timeMessageError = '';

try {
  // Build event type extensions from UI fields
  const extensions = buildExtensionsForEventType(reminder);
  // Only send an extension if there are fields to send (otherwise undefined so DB doesn't make an extension)
  const extensionsToSend = (extensions && extensions.length > 0) ? extensions : undefined;
  // Reminder is not yet saved (first time saving after clicking add), create reminder in DB
  if (!reminder.isSaved) {
  //console.log('Saving reminder extensions:', extensions);
  // Create base reminder in local DB and retrieve the itemID assigned to it
  const itemID = await createReminder(reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEnd, notificationTimestampToSend, hasNotification, reminder.temporaryTitle, extensionsToSend);
  console.log('DBG SAVE payload', { idTemp: reminder.itemID, eventType: reminder.eventType, eventStartTime, eventEnd, extensionsToSend });
  console.log('Reminder successfully created:', String(itemID));

  // Fetch the newly created reminder from the DB 
  const row = await readReminder(itemID);
  // console.log('Read reminder extensions: readReminder row.extensions =', row?.extensions);
  
  // Map DB row into UI and update reminders.value array
  if (row) {
    mapDBToUIReminder(row, true);
  }

  folders.value = mapDBToUIFolder(await readAllFolders());
  await loadRemindersForCalendarDate(selectedDate.value);

  // Reload calendar month to include newly added reminder
  await loadRemindersForMonth(selectedDate.value);
  }
  // Reminder is saved, just updating a preexisting reminder
  else {
      await updateReminder(reminder.itemID, reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEnd, notificationTimestampToSend, hasNotification, reminder.temporaryTitle, extensionsToSend);
      console.log('Reminder updated successfully in DB.');

      // Fetch the newly created reminder from the DB 
      const row = await readReminder(reminder.itemID);

      // Map DB row into UI and update reminders.value array
      if (row) {
        mapDBToUIReminder(row, true);
      }

      // Refresh folders to show newly added reminder in file explorer tree
      folders.value = mapDBToUIFolder(await readAllFolders());
      // Reload reminders for selected calendar date to include newly added reminder
      await loadRemindersForCalendarDate(selectedDate.value);
      // Reload calendar month to include updated reminder
      await loadRemindersForMonth(selectedDate.value);
  }
  } catch (error) {
    console.error('Error adding reminder:', error);
  }
}

// Function to delete selected individual checkbox reminders
async function deleteReminder(reminder: UIReminder) {
  try {
    // Delete specific reminder from local DB
    await deleteItem(reminder.itemID, 12);
    // Update reminders array to filter out deleted reminder
    // Array only contains reminders where the itemID does not match the deleted reminder's itemID
    reminders.value = reminders.value.filter(r => r.itemID !== reminder.itemID);
    console.log('Reminder deleted successfully from DB.');
    // Refresh folders for tree to remove deleted reminder
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Reload reminders for calendar date after deleted reminder
    await loadRemindersForCalendarDate(selectedDate.value);
    // Reload calendar month to include updated reminder
    await loadRemindersForMonth(selectedDate.value);

  } catch (error) {
    console.error('Error deleting reminder from DB:', error);
  }
  // Remove reminders that have checkbox selected from reminders array
  // Creates new filtered array to render that only includes reminders that are not selected
  //reminders.value = reminders.value.filter(reminder => !reminder.isSelected);
}

// Function to delete selected individual checkbox notes
async function deleteNote(note: UINote) {
  try {
    // Delete specific note from local DB
    await deleteItem(note.itemID, 11);
    // Update notes array to filter out deleted note
    // Array only contains notes where the itemID does not match the deleted note's itemID
    notes.value = notes.value.filter(n => n.itemID !== note.itemID);
    console.log('Note deleted successfully from DB.');
    // Refresh folders for tree to remove deleted note
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Re-load notes after deleted note
    await loadNotes();
  } catch (error) {
    console.error('Error deleting note from DB:', error);
  }
  // Remove notes that have checkbox selected from notes array
  // Creates new filtered array to render that only includes notes that are not selected
  // notes.value = notes.value.filter(note => !note.isSelected);
}

// Function to delete a folder or note/reminder from tree and DB
async function deleteTreeNode() {
  const selectedNode = selectedFolderID.value;
  // No tree node is selected, return
  if (selectedNode == null) {
    return;
  }

  // Tree node has a positive ID, a folder is selected
  if (selectedNode >= 0n) {
    // Find folder from folders array that matches currently selected tree node
    const folderToDelete = folders.value.find(folder => String(folder.folderID) === String(selectedNode));
    if (!folderToDelete) {
      return;
    }
        try {
          await deleteFolder(folderToDelete.folderID);
          folders.value = mapDBToUIFolder(await readAllFolders());
          await loadRemindersForCalendarDate(selectedDate.value);
          // Delete from calendar
          await loadRemindersForMonth(selectedDate.value);
          await loadNotes();
          // Clear tree node selection after deletion
          selectedFolderID.value = null;
        } catch (error) {
          console.error('Error deleting folder from DB:', error);
        }
        return;
    }

  // Tree node has a negative ID, a note or reminder is selected
  if (selectedNode < 0n) {
    const itemID = -selectedNode;

    // Find note from notes array that matches currently selected tree node
    const noteToDelete = notes.value.find(note => String(note.itemID) === String(itemID));
    if (noteToDelete) {
      try {
        // Delete specific selected note from DB and refresh UI
        await deleteItem(noteToDelete.itemID, 11);
        // Remove deleted note from notes array for UI rendering
        notes.value = notes.value.filter(note => String(note.itemID) !== String(noteToDelete.itemID));
        folders.value = mapDBToUIFolder(await readAllFolders());
        await loadNotes();
        // Clear tree node selection after deletion
        selectedFolderID.value = null;
      } catch (error) {
        console.error('Error deleting note from DB:', error);
      }
      return;
    }

    // Find reminder from reminders array that matches currently selected tree node
    const reminderToDelete = reminders.value.find(reminder => String(reminder.itemID) === String(itemID));
    if (reminderToDelete) {
      try {
        // Delete specific selected reminder from DB and refresh UI
        await deleteItem(reminderToDelete.itemID, 12);
        // Remove deleted reminder from reminders array for UI rendering
        reminders.value = reminders.value.filter(reminder => String(reminder.itemID) !== String(reminderToDelete.itemID));
        folders.value = mapDBToUIFolder(await readAllFolders());
        await loadRemindersForCalendarDate(selectedDate.value);
        // Delete from calendar
        await loadRemindersForMonth(selectedDate.value);
        // Clear tree node selection after deletion
        selectedFolderID.value = null;
      } catch (error) {
        console.error('Error deleting reminder from DB:', error);
      }
      return;
    }
  }
}

// Toggles behavior of add button. If on reminder tab, add a reminder to array. If on notes tab, add a note to array.
async function addArrayItem() {
  if (tab.value === 'reminders') {
    addReminder();
  } else if (tab.value === 'notes') {
    addNote();
  }
}

// Toggles behavior of delete button. If on reminder tab, delete selected reminders from array. If on notes tab, delete selected notes from array.
async function deleteArrayItem() {
  if (tab.value === 'reminders') {
    // Delete all selected reminders by calling deleteReminder for each selected item
    const selectedReminders = reminders.value.filter(reminder => reminder.isSelected);
    for (const reminder of selectedReminders) {
      await deleteReminder(reminder);
    }
  } else if (tab.value === 'notes') {
    // Delete all selected notes by calling deleteNote for each selected item
    const selectedNotes = notes.value.filter(note => note.isSelected);
    for (const note of selectedNotes) {
      await deleteNote(note);
    }
  }
}

// Reverts fields back to stored values from DB for a reminder when cancel button is clicked or remove draft
async function cancelReminder(reminder: UIReminder) {
  // Reminder is a draft, remove from list
  if (!reminder.isSaved) {
    reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
    // Reload list for selected calendar date
    await loadRemindersForCalendarDate(selectedDate.value);
  // Reminder is saved, revert temporary fields back to saved database values
  } else {
    const row = await readReminder(reminder.itemID); 
    if (row) {
      mapDBToUIReminder(row, true);
    } 
  }
}

// Reverts fields back to stored values from DB for a note when cancel button is clicked or remove draft
async function cancelNote(note: UINote) {
  // Note is a draft, remove from list
  if (!note.isSaved) {
    notes.value = notes.value.filter(n => String(n.itemID) !== String(note.itemID));
    // Reload note list
    await loadNotes();
  // Note is saved, revert temporary fields back to saved database values
  } else {
    // Reload DB row of note and restore fields
    const row = await readNote(note.itemID);
    if (row) {
      mapDBToUINote(row, true);
    }
  }
}

// Watcher on the checkbox to select and deselect all reminders or notes when select all checkbox is toggled
watch(selectAll, (selectionVal) => {
  if (tab.value === 'reminders') {
    filteredReminders.value.forEach(reminder => {
      reminder.isSelected = selectionVal;
    });
  } else if (tab.value === 'notes') {
    notes.value.forEach(note => {
      note.isSelected = selectionVal;
    });
  }
});


// template and script source code from slot - day month example
// https://qcalendar.netlify.app/developing/qcalendar-month
const calendar = ref<QCalendarMonth>(),
  selectedDate = ref(today()),
  selectedYear = ref(new Date().getFullYear()),
  locale = ref('en-US')

const formattedMonth = computed(() => {
  const date = new Date(selectedDate.value)
  const formatter = monthFormatter()
  return formatter ? formatter.format(date) : ''
})

// Filtered reminder array for displaying only reminders that match the selected calendar date or search query
const filteredReminders = computed(() => {
  //return reminders.value.filter(reminder => reminder.date === selectedDate.value)
  // Normalize search query: remove whitespace and convert to lowercase for case-insensitive matching
  // Search functionality example: https://stackoverflow.com/questions/74670957/how-to-display-search-results-using-react-typescript
  const query = (searchQuery.value ?? '').trim().toLowerCase();
  if (!searchQuery.value) {
    // If no search query, default show reminders for selected calendar date
    return reminders.value.filter(reminder => reminder.date === selectedDate.value);
  }

  // Otherwise, filter reminders based on the search query (title)
  return reminders.value.filter(reminder => {
    // Check for reminders entries where the title is in the search query
    const matchesQuery = String(reminder.temporaryTitle ?? '').toLowerCase().includes(query) || String(reminder.title ?? '').toLowerCase().includes(query);
    // Return true if both date and query match
    return matchesQuery;
  });
});

// Reload list of reminders whenever the selected calendar date changes
watch(selectedDate, async (newDate) => {
  // Load reminders for newly selected calendar date
  await loadRemindersForCalendarDate(newDate);
});

// Create events on calendar from reminders
const events = computed(() => buildCalendarEvents(monthReminders.value, eventTypes, folders.value))
// Group events by date
const eventsMap = computed(() => groupEventsByDate(events.value))

// If user clicks calendar event, route to that reminder entry
function onClickCalendarEvent(event: CalendarEvent) {
  // Find reminder that matches event
  const reminder = reminders.value.find(reminder => String(reminder.itemID) === String(event.id));
  if (!reminder) {
    return;
  } 
  tab.value = 'reminders';
  selectedDate.value = reminder.date;
  reminders.value.forEach(reminder => { reminder.expanded = false; })
  reminder.expanded = true;
}

// Filtered notes array for displaying only notes that match the search query
const filteredNotes = computed(() => {
  // Normalize search query: remove whitespace and convert to lowercase for case-insensitive matching
  // Search functionality example: https://stackoverflow.com/questions/74670957/how-to-display-search-results-using-react-typescript
  const query = (searchQuery.value ?? '').trim().toLowerCase();
  if (!searchQuery.value) {
    // If no search query, default show all the notes
    return notes.value;
  }

  // Otherwise, filter notes based on the search query (title)
  return notes.value.filter(note => {
    // Check for note entries where the title is in the search query
    const matchesQuery = String(note.temporaryTitle ?? '').toLowerCase().includes(query) || String(note.title ?? '').toLowerCase().includes(query);
    return matchesQuery;
  });
  });


// Watcher to unselect the select all checkbox if there are no reminders or notes in the array (ex. none made or after deletion)
watch([filteredReminders, notes, tab], () => {
  if (tab.value == 'reminders' && filteredReminders.value.length === 0) {
    selectAll.value = false;
  }
  if (tab.value === 'notes' && notes.value.length === 0) {
    selectAll.value = false;
  }
});

// Watcher on cloud sync toggle to reset message when changed
watch(isCloudOn, (enabled) => {
  if (!enabled) {
    syncStatusMessage.value = 'Cloud Sync Disabled';
  }
});

function monthFormatter() {
  try {
    return new Intl.DateTimeFormat(locale.value || undefined, {
      month: 'long',
      timeZone: 'UTC',
    })
  } catch {
    //
  }
}

function addToYear(amount: number) {
  // parse current date to timestamp
  let ts = parseTimestamp(selectedDate.value)
  if (ts) {
    // add specified amount of days
    ts = addToDate(ts, { year: amount })
    // re-assign values
    selectedDate.value = ts.date
    selectedYear.value = ts.year
  }
}

function onToday() {
  if (calendar.value) {
    calendar.value.moveToToday()
  }
}

function onPrev() {
  if (calendar.value) {
    calendar.value.prev()
  }
}
function onNext() {
  if (calendar.value) {
    calendar.value.next()
  }
}

// Show reminders for current calendar month
async function onMoved(data: Timestamp) {
  console.log('qcalendar onMoved payload:', data);
  await loadRemindersForMonth(selectedDate.value);
}
async function onChange(data: Timestamp) {
  console.log('qcalendar onChange payload:', data);
  await loadRemindersForMonth(selectedDate.value);
}

function onClickDate(data: Timestamp) {
  console.info('onClickDate', data)
}
function onClickDay(data: Timestamp) {
  console.info('onClickDay', data)
}
function onClickWorkweek(data: Timestamp) {
  console.info('onClickWorkweek', data)
}
function onClickHeadDay(data: Timestamp) {
  console.info('onClickHeadDay', data)
}
function onClickHeadWorkweek(data: Timestamp) {
  console.info('onClickHeadWorkweek', data)
}

async function logout()
{
  try {
    const isDeleted: boolean = await window.electronAuthAPI.clearLocalData();
    if(isDeleted){
            console.log('Account logout result:', isDeleted);
            $q.notify({
            type: 'positive',
            message: 'Successfully logged out'
            });
            //close popup of Login options (i.e. change login and logout)
            showLoginOptions.value = false;
            await router.push('/login');
        } 
    } catch (error) {
      console.error('Logout failed:', error);
    }
}

async function checkLoggedIn()
{
  try{
    const isloggedIn: boolean = await window.electronAuthAPI.isUserLoggedIn();
    if (isloggedIn) {
      showLoginOptions.value = true;
    } else {
      await router.push('/register');
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

async function saveLoginChanges() {
  try {
    const isLoginChanged = await window.electronAuthAPI.changeLogin(newUsername.value, newPassword.value);
    if (isLoginChanged) {
      console.log('Login credentials changed successfully:', isLoginChanged);
      $q.notify({
        type: 'positive',
        message: 'Login credentials changed successfully.'
      });
      //close popup of Login options (i.e. change login and logout)
      showLoginOptions.value = false;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to change login credentials. Please try again.'
      });
    }
  
  }catch (error) {
    console.error('Error changing login credentials:', error);
  }

}


function convertHexToInt(hexColor: string): number {
  // Remove the leading '#' 
  hexColor = hexColor.slice(1);
  //console.log('Converting hex color to int:', hexColor);
  // Parse the hex string to an integer
  return Number.parseInt(hexColor, 16);
} 
  const colorHex = ref<string>('#459dd8'); // Default folder color hex value

async function saveFolderColor(folder: UIFolder | null){
  try {
    if (!folder) {
      console.warn('saveFolderColor: no folder provided');
      return;
    }
    // Update folder color in local DB
    await updateFolder(folder.folderID, folder.parentFolderID, convertHexToInt(colorHex.value), folder.folderName);
    // Refresh folder list after color update
    folders.value = mapDBToUIFolder(await readAllFolders());
  }
  catch (error) {
    console.error('Error updating folder color:', error);
  }
}


</script>