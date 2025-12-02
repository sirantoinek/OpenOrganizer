<!--
 * Authors: Rachel Patella, Maria Pasaylo, Michael Jagiello
 * Created: 2025-09-22
 * Updated: 2025-12-02
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
 * https://github.com/quasarframework/quasar/discussions/12942 for how native input type doesn't cast to number by default
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
            <div v-if="settingsTab === 'local'" class="local-settings">
              <q-input v-model="serverAddress" type="text" square filled placeholder="Server Address" />
              <q-btn flat label="Save" @click=saveServerAddress v-close-popup />
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
                  autofocus
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
                        context-menu
                        @hide="updatePresetColor()"
                        >
                          <q-color
                          v-model="colorHex"
                          default-view="palette"
                          :palette="presetColors"
                          class="my-picker"
                          @update:model-value="saveFolderColor(getFolder(node.id))"
                          >
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
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="add"  label="Add">
          <q-menu>
          <q-list style="min-width: 100px">
            <q-item @click= addExplorerReminder(); clickable v-close-popup>
              <q-item-section>Reminder</q-item-section>
            </q-item>
            <q-item @click = addExplorerNote(); clickable v-close-popup>
              <q-item-section>Note</q-item-section>
            </q-item>
              <q-item @click= addFolder(); clickable v-close-popup>
              <q-item-section>Folder</q-item-section>
            </q-item>
            </q-list>
          </q-menu>
        </q-btn>
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="delete"  label="Delete" @click="deleteTreeNode()" />
          <q-btn style="font-size: 0.9rem; color: #474747;" flat  icon="edit"  label="Rename" @click="renameTreeNode()" />
        </div>
      </div>
     
      <!-- Left column - File Explorer bottom row-->
      <div style="grid-area: file-explorer-cloud; padding: 20px 30px; display: flex; border-top: 1px solid #adadadcc; align-items: center; gap: 8px;" data-area="file-explorer-cloud">
        <q-btn class="sync-button" icon="sync" no-caps @click="onToggleCloudSync">Sync</q-btn>
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
                    <!--- Title is readonly and not editable for a generated reminder. Generated titles stay the same as its parent series title. -->
                    <q-checkbox :color="getEventTypeColor(eventTypes, item.eventType)" v-model="item.isSelected" class="q-mr-sm" />
                    <q-input
                      v-model="item.temporaryTitle"
                      :error="item.titleMessageError != ''"
                      :error-message="item.titleMessageError"
                      :readonly="item.isGenerated"
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
                      <!-- Single-day non-recurring reminder -->
                      <template v-if="!item.isRecurring && !item.temporaryEventEndDateEnabled">
                        Event date: {{ eventDatetoLocaleString(item.date) }}<br>
                      </template>
                      
                      <!-- Multi-day non-recurring reminder -->
                      <template v-else-if="!item.isRecurring && item.temporaryEventEndDateEnabled">
                        Event start: {{ eventDatetoLocaleString(item.date) }}<br>
                        Event end: {{ eventDatetoLocaleString(item.temporaryEventEndDay) }}<br>
                      </template>
                      
                      <!-- Recurring reminder -->
                      <template v-else-if="item.isRecurring && item.recurrence?.daily">
                        Series start: {{ eventDatetoLocaleString(item.date) }}<br>
                        Series end: {{eventDatetoLocaleString(item.recurrence.daily.seriesEndDate)}}<br>
                      </template>

                      <template v-else-if="item.isRecurring && item.recurrence?.weekly">
                        Series start: {{ eventDatetoLocaleString(item.date) }}<br>
                        Series end: {{eventDatetoLocaleString(item.recurrence.weekly.seriesEndDate)}}<br>
                      </template>

                      <template v-else-if="item.isRecurring && item.recurrence?.monthly">
                        Series start: {{ eventDatetoLocaleString(item.date) }}<br>
                        Series end: {{eventDatetoLocaleString(item.recurrence.monthly.seriesEndDate)}}<br>
                      </template>

                       <template v-else-if="item.isRecurring && item.recurrence?.yearly">
                        Series start: {{ eventDatetoLocaleString(item.date) }}<br>
                        Series end: {{eventDatetoLocaleString(item.recurrence.yearly.seriesEndDate)}}<br>
                      </template>
                      
                      <template v-if="!item.isGenerated">
                      Last modified: {{ item.temporaryLastModified }}
                      </template>

                      <div v-if="item.isGenerated">
                      This is a generated reminder from a recurring series. Title, folder, and event type are not editable.
                      </div>
                    </div>
                <q-checkbox
                  v-if="!item.isRecurring && !item.isGenerated"
                  v-model="item.temporaryEventEndDateEnabled"
                  label="Multi‑day"
                  dense
                  hide-bottom-space
                  :color="getEventTypeColor(eventTypes, item.eventType)" 
                  style="margin-bottom:10px"
                />
                <br>
                <q-checkbox
                   v-if="!item.temporaryEventEndDateEnabled && !item.isGenerated"
                  v-model="item.isRecurring"
                  @update:model-value="val => onToggleRecurrenceType(item, val)"
                  label="Recurring"
                  dense
                  hide-bottom-space
                  :color="getEventTypeColor(eventTypes, item.eventType)" 
                  style="margin-bottom:10px"
                />
                <q-select
                v-model="item.eventType"
                :options="eventTypeOptions"
                :disable="item.isGenerated"
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
                :disable="item.isGenerated"
                label="Save in folder"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
              <q-select
                :model-value="getNotificationOffset(item)"
                @update:model-value="val => setNotificationOffset(item, val)"
                :options="notificationOptions"
                label="Remind me:"
                emit-value 
                map-options
                dense
                outlined
                style="background-color: #f2f2f2; margin-bottom: 10px"
              />
              <!-- everyNDays (daily) must not be less than 1 and timeOfDayMin must be between 0 and 1439-->
              <div v-if="item.recurrence">
                   <q-select
                    :model-value="item.recurrence.type"
                    @update:model-value="val => onRecurrenceTypeChange(item, val)"
                    :options="recurrenceOptions"
                    label="Recurrence Type"
                    emit-value
                    map-options
                    dense
                    outlined
                    style="background-color: #f2f2f2; margin-bottom: 10px"
                  />
                  <div v-if="item.recurrence.type === 'daily' && item.recurrence.daily" style="margin-bottom:8px;">
                  <q-input
                  v-model.number="item.recurrence.daily.timeOfDayMin"
                  label="Event Time (in minutes into day)"
                  :min="0"
                  :max="1439"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model.number="item.recurrence.daily.eventDurationMin"
                  label="Event Duration (in minutes)"
                  :min="0"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model.number="item.recurrence.daily.everyNDays"
                  label="Frequency (every # days)"
                  type="number"
                  :min="1"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <!--- Limiting series end date to 100 years from now at max -->
                <q-input
                  v-model="item.recurrence.daily.seriesEndDate"
                  label="Series End Date"
                  type="date"
                  :min="item.date"
                  :max="endDateRangeRecurring(item.date, selectedDate)"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                </div>
                <div v-if="item.recurrence.type === 'weekly' && item.recurrence.weekly" style="margin-bottom:8px;">
                  <q-input
                  v-model.number="item.recurrence.weekly.timeOfDayMin"
                  label="Event Time (in minutes into day)"
                  :min="0"
                  :max="1439"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model.number="item.recurrence.weekly.eventDurationMin"
                  label="Event Duration (in minutes)"
                  :min="0"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model.number="item.recurrence.weekly.everyNWeeks"
                  label="Frequency (every # weeks)"
                  type="number"
                  :min="1"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-select
                  v-model="item.recurrence.weekly.daysOfWeek"
                  :options="daysOfWeekOptions"
                  label="Days of the week:"
                  multiple
                  emit-value 
                  map-options
                  dense
                  outlined
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model="item.recurrence.weekly.seriesEndDate"
                  label="Series End Date"
                  type="date"
                  :min="item.date"
                  :max="endDateRangeRecurring(item.date, selectedDate)"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                </div>
                <div v-if="item.recurrence.type === 'monthly' && item.recurrence.monthly" style="margin-bottom:8px;">
                  <q-input
                  v-model.number="item.recurrence.monthly.timeOfDayMin"
                  label="Event Time (in minutes into day)"
                  :min="0"
                  :max="1439"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model.number="item.recurrence.monthly.eventDurationMin"
                  label="Event Duration (in minutes)"
                  :min="0"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-checkbox
                  v-model="item.recurrence.monthly.lastDayOfMonth"
                  label="Notify on last day of the month"
                  dense
                  hide-bottom-space
                  style="margin-bottom: 10px"
                />
                <!-- Example QDate with QInput component code from here: https://quasar.dev/vue-components/date#with-qinput-->
                  <q-input 
                  placeholder="Days of the month"
                  readonly
                  :model-value="selectedDayOfMonth"
                  outlined
                  dense
                   style="background-color: #f2f2f2; margin-bottom: 10px"
                  > 
                  <!-- Normalize the visible date picker to be a static month with 31 days -->
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="DaysOfMonthSelection" 
                          :key="String(item.itemID)"
                          multiple 
                          minimal
                          class="monthly-day-picker"
                          default-year-month="2024/12"
                          style="width: 200px;">
                            <div class="row items-center justify-end">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                <q-input
                  v-model="item.recurrence.monthly.seriesEndDate"
                  label="Series End Date"
                  type="date"
                  :min="item.date"
                  :max="endDateRangeRecurring(item.date, selectedDate)"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                </div>
                <div v-if="item.recurrence.type === 'yearly' && item.recurrence.yearly" style="margin-bottom:8px;">
                  <q-input
                  v-model.number="item.recurrence.yearly.timeOfDayMin"
                  label="Event Time (in minutes into day)"
                  :min="0"
                  :max="1439"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model.number="item.recurrence.yearly.eventDurationMin"
                  label="Event Duration (in minutes)"
                  :min="0"
                  type="number"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
                <q-input
                  v-model="item.recurrence.yearly.dayOfYear"
                  label="Recurrence Date"
                  type="date"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                  />
                 <q-input
                  v-model="item.recurrence.yearly.seriesEndDate"
                  label="Series End Date"
                  type="date"
                  :min="item.date"
                  :max="endDateRangeRecurring(item.date, selectedDate)"
                  outlined
                  dense
                  style="background-color: #f2f2f2; margin-bottom: 10px"
                />
              </div>
            </div>
              <!-- Hide generic reminders temporary event start and end time for event types -->
              <template v-if="item.eventType !== 1 && item.eventType !== 2 && !item.isRecurring">
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
                        :min="endDateRange(item.date, selectedDate).min"
                        :max="endDateRange(item.date, selectedDate).max"
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
                  <!--Extension times are only shown for normal/generated reminders, recurring uses tiemOfDayMin and eventDuration -->
                  <template v-if="!item.isRecurring && !item.isGenerated">
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
                  </template>
                  <template v-if="item.isGenerated">
                  <q-input
                  v-model="item.temporaryEventStartTime"
                  label="Departure Time"
                  type="time"
                  outlined
                  dense
                  class="flight-half"
                  />
                  <q-input
                  v-model="item.temporaryEventEndTime"
                  label="Arrival Time"
                  type="time"
                  outlined
                  dense
                  class="flight-half"
                  />
                  </template>
                  <div v-if="item.temporaryEventEndDateEnabled" style="width:100%; grid-column: 1 / -1;">
                    <q-input
                      v-model="item.temporaryEventEndDay"
                      label="Flight Arrival Date"
                      outlined
                      dense
                      type="date" 
                      :min="endDateRange(item.date, selectedDate).min"
                      :max="endDateRange(item.date, selectedDate).max"
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
                <template v-if="!item.isRecurring && !item.isGenerated">
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
                </template>
                <template v-if="item.isGenerated">
                <q-input
                v-model="item.temporaryEventStartTime"
                label="Check-in Time"
                type="time"
                outlined
                dense
                class="flight-half"
                />
                <q-input
                v-model="item.temporaryEventEndTime"
                label="Check-out Time"
                type="time"
                outlined
                dense
                class="flight-half"
                />
                </template>
                <div v-if="item.temporaryEventEndDateEnabled" style="width:100%; grid-column: 1 / -1;">
                  <q-input
                    outlined
                    dense
                    type="date"
                    label="Check-out Date"
                    v-model="item.temporaryEventEndDay"
                    :min="endDateRange(item.date, selectedDate).min"
                    :max="endDateRange(item.date, selectedDate).max"
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
                <div class="row" style="display:flex; flex-wrap:wrap; align-items:center">
                  <q-btn class="login-register-button" style="font-size: 15px; margin-right: 10px" flat label="Save" @click="saveReminder(item)"></q-btn>
                  <q-btn v-if="!item.isGenerated" class="login-register-button" style="background-color: grey; font-size: 15px" flat label="Cancel" @click="cancelReminder(item)"></q-btn>
                  <q-btn v-if="item.isGenerated" class="login-register-button" style="font-size: 15px" flat label="View Series" @click="showParentSeriesFromGeneratedReminder(item)"></q-btn>
                  <q-btn v-if="item.isRecurring && previousListState && String(previousListState.parentSeriesID) === String(item.itemID)" class="login-register-button" style="background-color: grey; font-size: 15px; margin-left: 10px;"  flat label="View Generated" @click="showGeneratedReminderFromParentSeries()"></q-btn>
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
                <q-input class="note-box" outlined v-model="item.temporaryText" type="textarea" 
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
            max-width: 500px;
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
            <div style="display: flex; max-width: 600px; width: 100%; flex-direction: column;"> 
              <q-calendar-month ref="calendar" v-model="selectedDate" mini-mode hoverable focusable
                :focus-type="['date', 'weekday']" :min-weeks="6" animated 
                @click-date="onClickDate" @click-day="onClickDay" @click-workweek="onClickWorkweek"
                @click-head-workweek="onClickHeadWorkweek" @click-head-day="onClickHeadDay" style="height: 400px;" >
                <template #day="{ scope: { timestamp } }">
                <div style="display: flex; flex-direction: row; gap: 3px; padding: 2px; align-items: center; justify-content: center; overflow:hidden; max-height: 24px;">
              <template v-for="event in eventsMap[timestamp.date]" :key="String(event.id)">
                <!--MARIA start here just call a function to change background-->
                <div
                :class="`bg-${event.color}`"
                :style="{backgroundColor: event.color, width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer', flexShrink: 0}"
                @click="onClickCalendarEvent(event)"
              >
                <!-- Tooltip on hover to clarify if event start or end -->
                <q-tooltip v-if="event.isStart || event.isEnd">
                  <!-- If single day, combined start and end labels. If multi-day start and end separate labels. -->
                  {{ (event.isStart && event.isEnd) ? `${event.title} event` : (event.isStart ? `${event.title} event start` : `${event.title} event end`) }}
                </q-tooltip>
                </div>
              </template>
              </div>
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
// Imports
import { QCalendarMonth, addToDate, parseTimestamp, today, isLeapYear, type Timestamp } from '@quasar/quasar-ui-qcalendar';
import '@quasar/quasar-ui-qcalendar/index.css';
import { buildCalendarEvents, groupEventsByDate, getEventTypeColor, getEventTypeFields, getEventStartLabel, stripNulls, getEventEndLabel, type EventType, type CalendarEvent } from '../frontend-utils/events';
import { buildBreadcrumbs, normalizeFolderID, buildRootNodes} from '../frontend-utils/tree';
import { convertTimeAndDateToTimestamp, convertNotificationTimestamp, minutesToHHMM, timeStamptoEpoch, normalizeDatePickerToCalendar, eventDatetoLocaleString, endDateRange, endDateRangeRecurring } from '../frontend-utils/time';
import { ref, computed, watch, onMounted } from 'vue';
import type { UINote, UIReminder, UIFolder } from '../types/ui-types';
import type { Reminder, DailyReminder, WeeklyReminder, MonthlyReminder, YearlyReminder, GeneratedReminder, Note, Folder, Extension } from '../../src-electron/types/shared-types';
import {createNote, createReminder, createDailyReminder, createWeeklyReminder, createMonthlyReminder, createYearlyReminder, createOrUpdateOverride, createFolder, createRootFolder,
  readNote, readNotesInRange, readReminder, readDailyReminder, readWeeklyReminder, readMonthlyReminder, readYearlyReminder, readRemindersInRange, readDailyRemindersInRange, readWeeklyRemindersInRange, readMonthlyRemindersInRange, readYearlyRemindersInRange, readGeneratedRemindersInRange, readAllFolders, 
  updateNote, updateReminder, updateDailyReminder, updateWeeklyReminder, updateMonthlyReminder, updateYearlyReminder, updateFolder, 
  deleteItem, deleteFolder } from '../utils/local-db';
import { FieldsToFlight, FieldsToHotel, FlightToExtensions, HotelToExtensions, ExtensionsToFlight, ExtensionsToHotel } from '../utils/eventtypes';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { ValidateFlight, ValidateHotel } from '../utils/validate';
import { QMenu, QColor } from 'quasar';
import {convertInttoHex} from '../frontend-utils/tree';

// Initialize active tab to reminder by default
const tab = ref('reminders');
// Array of normal, recurring, and generated reminders for list and file explorer
const reminders = ref<UIReminder[]>([])
// Array of reminders loaded by month specifically for calendar
const monthReminders = ref<UIReminder[]>([])
// Array of notes
const notes = ref<UINote[]>([])
// Stores the array of full dates selected in qdate component for monthly recurrence
const DaysOfMonthSelection = ref<string[]>([]);
const selectAll = ref(false)
const searchQuery = ref('');
// Used to store the middle list state when viewing a parent series from generated to be able to go back 
const previousListState = ref<{
  // Switch to correct calendar date
  calendarDate: string;
  // Route back to generated card from parent series
  generatedID: bigint;
  // Route to parent series from generated card
  parentSeriesID: bigint;
} | null>(null);

// Filtered reminder array for displaying only reminders that match the selected calendar date or search query
const filteredReminders = computed(() => {
  // Normalize search query: remove whitespace and convert to lowercase for case-insensitive matching
  // Search functionality example: https://stackoverflow.com/questions/74670957/how-to-display-search-results-using-react-typescript
  const query = (searchQuery.value ?? '').trim().toLowerCase();

  // By default, middle list only shows normal reminders, generated reminders, and recurring drafts (or saved reminders being converted to recurring)
  const defaultReminderList = reminders.value.filter(reminder => !reminder.isRecurring || !reminder.isSaved || reminder.isConverting);

 // No search query, either show recurring reminder if selected on file explorer
 // Or show default list otherwise (normal reminders, generated reminders, and recurring drafts)
  if (!searchQuery.value) {
    if (selectedFolderID.value !== null && selectedFolderID.value < 0n) {
      const selectedNode = -selectedFolderID.value;
      // Check if the selected tree node ID (converted to positive) matches a recurring reminder itemID
      const recurringReminder = reminders.value.find(reminder => String(reminder.itemID) === String(selectedNode) && reminder.isRecurring && reminder.isSaved);
      if (recurringReminder) {
        return [recurringReminder];
      }
    }
    // Otherwise, show reminders that match the selected date from calendar
      return defaultReminderList.filter(reminder => reminder.date === selectedDate.value);
  }

  // Otherwise, if search query is provided, only search normal reminders, generated reminders, and recurring drafts (default list) by title
  return defaultReminderList.filter(reminder => {
    // Check for reminders entries where the title is in the search query
    const matchesQuery = String(reminder.temporaryTitle ?? '').toLowerCase().includes(query) || String(reminder.title ?? '').toLowerCase().includes(query);
    // Return true if both date and query match
    return matchesQuery;
  });
});

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

// Function to show the parent series in middle list linked to generated reminder
// Occurs when user clicks navigate to parent from a generated reminder card
function showParentSeriesFromGeneratedReminder(generatedReminder: UIReminder) {
  // Not a generated reminder or linked parent ID is missing
  if (!generatedReminder || generatedReminder.linkedParentSeriesID == null) {
    return;
  }

  // Save current default list view (generated + normal reminders) before switching to series view
  previousListState.value = {
    calendarDate: selectedDate.value,
    generatedID: generatedReminder.itemID,
    parentSeriesID: generatedReminder.linkedParentSeriesID
  }

  // Try to find parent series reminder linked to this generated reminder
  const parentSeries = reminders.value.find(reminder => String(reminder.itemID) === String(generatedReminder.linkedParentSeriesID))
  // Return if parent cannot be found
  if (!parentSeries) {
    return;
  }

  // Parent found, switch middle list view to show the generated reminders parent series
  tab.value = 'reminders';
  // Route to the date that the series was created on
  selectedDate.value = parentSeries.date;
  // Select parent series on file explorer so filteredReminders shows the series in the middle
  selectedFolderID.value = -parentSeries.itemID; 
  // Collapse all other reminders and expand parent series
  reminders.value.forEach(reminder => reminder.expanded = false);
  parentSeries.expanded = true
}

// Function to return back to middle list (normal reminders and generated) from parent series card
function showGeneratedReminderFromParentSeries() {
  if (!previousListState.value) {
    return;
  }
  
  // Restore calendar date back to previous calendar-selected generated reminders date
  selectedDate.value = previousListState.value.calendarDate;

  // Unselect the parent file explorer node
  selectedFolderID.value = null;

  // Find the generated reminder thats a child of the parent series from before
  const generated = reminders.value.find(reminder => String(reminder.itemID) === String(previousListState.value!.generatedID))
  // If found, collapse all other reminders and expand the generated
  if (generated) {
    tab.value = 'reminders';
    reminders.value.forEach(reminder => reminder.expanded = false);
    generated.expanded = true;
    // Clear out saved list state view
    previousListState.value = null;
    return;
  }
}

// Notification and dropdown variables/functions
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

// List of recurrence type options 
const recurrenceOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
  ];

// List of days of the week options
const daysOfWeekOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 }
];
  // Function to determine which variable to bind to for notification offset
  // Normal reminders use temporaryNotificationTime field, recurring reminders use notifOffsetTimeMin
  function getNotificationOffset(reminder: UIReminder): number | null {
    // If reminder is recurring, bind to notifOffsetTimeMin
    if (reminder.recurrence) {
      if (reminder.recurrence.type === 'daily' && reminder.recurrence.daily) {
         return reminder.recurrence.daily.notifOffsetTimeMin == null ? null : Math.abs(reminder.recurrence.daily.notifOffsetTimeMin);
      }
      else if (reminder.recurrence.type === 'weekly' && reminder.recurrence.weekly) {
        return reminder.recurrence.weekly.notifOffsetTimeMin == null ? null : Math.abs(reminder.recurrence.weekly.notifOffsetTimeMin);
      }
      else if (reminder.recurrence.type === 'monthly' && reminder.recurrence.monthly) {
        return reminder.recurrence.monthly.notifOffsetTimeMin == null ? null : Math.abs(reminder.recurrence.monthly.notifOffsetTimeMin);
      }
      else if (reminder.recurrence.type === 'yearly' && reminder.recurrence.yearly) {
        return reminder.recurrence.yearly.notifOffsetTimeMin == null ? null : Math.abs(reminder.recurrence.yearly.notifOffsetTimeMin);
      }
      // For any other recurrence type, return null (should not get here)
      return null;
    }
    else {
      // If reminder is not recurring, bind to temporaryNotificationTime
      return reminder.temporaryNotificationTime ?? null;
    }
  }

  // When user changes notification offset dropdown (val), update the correct field in the reminder
  function setNotificationOffset(reminder: UIReminder, val: number| null) {
    // If reminder is recurring, update notifOffsetTimeMin field to updated value
    if (reminder.recurrence) {
      if (reminder.recurrence.type === 'daily' && reminder.recurrence.daily) {
        reminder.recurrence.daily.notifOffsetTimeMin = val == null? null : Math.abs(val);
      }
      else if (reminder.recurrence.type === 'weekly' && reminder.recurrence.weekly) {
        reminder.recurrence.weekly.notifOffsetTimeMin = val == null? null : Math.abs(val);
      }
      else if (reminder.recurrence.type === 'monthly' && reminder.recurrence.monthly) {
        reminder.recurrence.monthly.notifOffsetTimeMin = val == null? null : Math.abs(val);
      }
      else if (reminder.recurrence.type === 'yearly' && reminder.recurrence.yearly) {
        reminder.recurrence.yearly.notifOffsetTimeMin = val == null? null : Math.abs(val);
      }
    } else {
      // If reminder is not recurring, update temporaryNotificationTime field to updated value
      reminder.temporaryNotificationTime = val;
    }
  }
  
// Event type variables/functions
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

    // If reminder is recurring and field is empty (intended as times are hidden), use recurrence timeOfDayMin (Start/Departure/Check-in time) and eventDuration (to compute End/Arrival/Check-out time)
    if (reminder.isRecurring && reminder.recurrence) {
     let minOfDay: number = 0;
     let eventDuration: number = 0;

     if (reminder.recurrence.type === 'daily' && reminder.recurrence.daily) {
      minOfDay = reminder.recurrence.daily.timeOfDayMin;
      eventDuration = reminder.recurrence.daily.eventDurationMin;
     }
     else if (reminder.recurrence.type === 'weekly' && reminder.recurrence.weekly) {
      minOfDay = reminder.recurrence.weekly.timeOfDayMin;
      eventDuration = reminder.recurrence.weekly.eventDurationMin;
     }
     else if (reminder.recurrence.type === 'monthly' && reminder.recurrence.monthly) {
      minOfDay = reminder.recurrence.monthly.timeOfDayMin;
      eventDuration = reminder.recurrence.monthly.eventDurationMin;
     }
     else if (reminder.recurrence.type === 'yearly' && reminder.recurrence.yearly) {
      minOfDay = reminder.recurrence.yearly.timeOfDayMin;
      eventDuration = reminder.recurrence.yearly.eventDurationMin;
     }
     // Convert timeOfDayMin from a number to a HH:MM string
     const startString = minutesToHHMM(minOfDay);
     // Compute end time from start time + event duration
     const endMin = (minOfDay + eventDuration) % 1440;
     const endString = minutesToHHMM(endMin);
     // Set extension times to start and end recurrence times if the fields exist
     if (fieldKey === 'depTime' || fieldKey === 'checkinTime') {
      return convertTimeAndDateToTimestamp(reminder.date, startString) ?? undefined;
     }
     else if (fieldKey === 'arrTime' || fieldKey === 'checkoutTime') {
      // Use event end day for multi-day events and event start day for single day events
      return convertTimeAndDateToTimestamp(eventEndDay, endString) ?? undefined;
     }
    }
        
    // Check if arrTime or checkOut time exist and reminder is normal/non-recurring
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

// Settings and cloud sync variables/functions
const settingsTab = ref('cloud');
const showSettings = ref(false);
const showLoginOptions = ref(false);
const showChangeLogin = ref(false);
const isCloudOn = ref(false);
const isSyncing = ref(false);
const isLoggedIn = ref(false);
console.log('const initialize', isLoggedIn.value);
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
    await load();
    // Since sync initiates on startup, set cloud toggle to on
    syncStatusMessage.value = 'Cloud Synced Successfully';
  } catch (error) {
    syncStatusMessage.value = 'Cloud Sync Failed';
    console.error('Error during cloud sync:', error);
   // Reset sync status for next time
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

// Main functionality (CRUD on recurrence, generated, normal reminders and notes)
// Since a recurrence is an optional property, function to safely toggle checkbox
function onToggleRecurrenceType(item: UIReminder, enabled: boolean) {
  // isRecurring property uses checkbox value from user
  item.isRecurring = enabled;
  // Clear time errors when toggling recurrence types
  item.timeMessageError = '';
  // If checkbox is enabled, initialize a default recurrence
  if (enabled) {
    item.recurrence = { 
    type: 'daily', 
    daily: {
    timeOfDayMin: 0,
    eventDurationMin: 0,
    notifOffsetTimeMin: null,
    everyNDays: 1,
    seriesEndDate: '' 
  }};
  // Make sure normal saved reminder is still visible in middle list while changing it to recurring
  if (item.isSaved) {
    item.isConverting = true;
  }
  } else {
    // If disabled, clear recurrence type
    item.recurrence = null;
    // Checkbox is disabled, reminder isnt becoming recurring
    item.isConverting = false;
  }
}

// Function to handle changing recurrence type from dropdown and ensure fields are initialized
function onRecurrenceTypeChange(reminder: UIReminder, val: string) {
  // Invalid dropdown type
  if (val !== 'daily' && val !== 'weekly' && val !== 'monthly' && val !== 'yearly') {
    return;
  }

   // Ensure recurrence object exists
  if (!reminder.recurrence) {
    // If it doesn't exist yet, create it with the type that is set
    reminder.recurrence = { type: val } as UIReminder['recurrence'];
  }

  // Otherwise, recurrence exists (set to not null for typescript)
  const recurrence = reminder.recurrence!;

   // Update the type of the recurrence to the dropdown choice
  recurrence.type = val;

  // Create matching recurrence object with defaults (daily, weekly, monthly or yearly) according to the selected type if it doesn't exist yet
  // If it already exists, those fields will just be rendered
  if (val === 'daily' && !recurrence.daily) {
    recurrence.daily = { 
    timeOfDayMin: 0,
    eventDurationMin: 0,
    notifOffsetTimeMin: null,
    everyNDays: 1,
    seriesEndDate: '' 
  }}

else if (val === 'weekly' && !recurrence.weekly) {
  recurrence.weekly = { 
    timeOfDayMin: 0,
    eventDurationMin: 0,
    notifOffsetTimeMin: null,
    daysOfWeek: [], // all days false by default
    everyNWeeks: 1,
    seriesEndDate: '' 
  }}

  else if (val === 'monthly' && !recurrence.monthly) {
  recurrence.monthly = { 
    timeOfDayMin: 0,
    eventDurationMin: 0,
    notifOffsetTimeMin: null,
    lastDayOfMonth: false,
    daysOfMonth: [], // all days false by default
    seriesEndDate: '' 
  }}

  else if (val === 'yearly' && !recurrence.yearly) {
  recurrence.yearly = { 
    timeOfDayMin: 0,
    eventDurationMin: 0,
    notifOffsetTimeMin: null,
    dayOfYear: '',
    seriesEndDate: '' 
  }}
}

// Extract just the days from the full dates of the DaysOfMonthSelection
// Use these days to set the daysOfMonth array in the MonthlyReminder recurrence 
// Computed so that it updates automatically when DaysOfMonthSelection changes
const selectedDayOfMonth = computed(() => {
  // If daysOfMonthSelection is missing or empty, show empty string
  if (!DaysOfMonthSelection.value || DaysOfMonthSelection.value.length === 0) {
    return '';
  }
   const days = DaysOfMonthSelection.value.map(dateString => {
    // Split each date string ex. "YYYY/MM/DD" in the array by '/' delimiter to get each part
    const parts = dateString.split('/');

    // Last part is the day component "DD"
    const dayPart = parts[2] ?? '';

    // Convert the day string "DD" to an integer to get rid of leading zeros like "01" for q-input display
    return parseInt(dayPart, 10);
    // Sort the days numerically in ascending order for q-input display
  }).sort((a, b) => a - b); 

  // Join back the stripped day numbers into a comma-separated string for q-input display
  return days.join(', ');
});


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
        // Reminder is recurring
        if (reminder.isRecurring) {
          tab.value='reminders';
          // Set date to reminder (series start) date on calendar
          selectedDate.value = reminder.date;
          // Collapse all other reminders except the selected entry
          reminders.value.forEach(reminder => {reminder.expanded = false; })
          // Expand the selected reminder card 
          reminder.expanded = true;
          return;
        }
        // Reminder is not recurring
        else {
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
        // Copy DB-saved name to temporary field to visually populate it for editing
        // The actual editing is bound to the temporaryFolderName field
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
// If escape on a draft (not saved, remove it entirely)
function cancelRename(item: UIReminder | UINote | UIFolder) {
  if (!item) return;

  // Distinguish between folder and reminder/note by checking for unique property
  // Cancel renaming a folder
  if ('temporaryFolderName' in item) {
    // Folder is a draft, remove from UI and keep all other entries
    if (!item.isSaved) {
      folders.value = folders.value.filter(f => String(f.folderID) !== String(item.folderID));
      // Clear tree node selection
      selectedFolderID.value = null;
      }
      else {
      // Get rid of input box
      item.isEditing = false;
      // Revert temporary name back to original folder name from DB
      item.temporaryFolderName = item.folderName;
      item.folderNameError = '';
      }
      return;
    }
   
  // Cancel renaming a reminder
  else if ('temporaryEventStartTime' in item) {
    item.isEditing = false;
    item.temporaryTitle = item.title ?? '';
    item.titleMessageError = '';
    return;
  }
  // Cancel renaming a note
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

// Temp ID generator for UI-only drafts (negative IDs)
// Negative ID for temp objects idea from: https://stackoverflow.com/questions/53850790/how-to-work-with-unsaved-entities-even-though-id-attribute-is-needed
let tempIDCounter = -2n;
// Function to add a reminder to the list on the specified calendar date
function addReminder() {
  // Create a UI-only draft reminder with a temporary negative bigint ID
  const tempID = tempIDCounter--;
  // Folder to save reminder in is either root by default if nothing is selected, otherwise selected folder in tree
  const folderID = normalizeFolderID(selectedFolderID.value, notes.value, reminders.value, folders.value) ?? 0n;

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
    temporaryEventEndDateEnabled: false,
    date: selectedDate.value,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: false, // Draft - first time hitting add creates a draft reminder not yet saved
    isEditing: false,
    isSelected: false,
    expanded: true,
    isRecurring: false,
    isConverting: false,
    isGenerated: false,
    linkedParentSeriesID: null
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
    // Filter out any normal reminders already in list for that date before loading from database to avoid duplicate display
    // Therefore, remove any normal reminders and keep recurring and generated
    reminders.value = reminders.value.filter(reminder => reminder.isRecurring || reminder.isGenerated || reminder.date !== dateString);
    // Read reminders for currently selected date from local DB
    const rows = await readRemindersInRange(startOfDay, endOfDay);
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of rows) {
      mapDBToUIReminder(reminder, true);
    }
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

  // Build start and end timestamps for previous month
  // If previous month is January, roll over to December of the previous year. Otherwise, decrement the month and stay in the year
  const prevMonth = (month === 1) ? 12 : month - 1;
  const prevYear = (month === 1) ? year - 1 : year;
  const prevMonthStartDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthLastDayString = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevMonthLastDay).padStart(2, '0')}`;
  const prevMonthStartRange = convertTimeAndDateToTimestamp(prevMonthStartDay, '');
  const prevMonthEndRange = convertTimeAndDateToTimestamp(prevMonthLastDayString, '23:59');

  // Build start and end timestamps for next month 
  // If month is December, roll over to January of the next year. Otherwise, increment the month and stay in the year
  const nextMonth = (month === 12) ? 1 : month + 1;
  const nextYear = (month === 12) ? year + 1 : year;
  const nextMonthStartDay = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const nextMonthLastDay = new Date(nextYear, nextMonth, 0).getDate();
  const nextMonthLastDayString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextMonthLastDay).padStart(2, '0')}`;
  const nextMonthStartRange = convertTimeAndDateToTimestamp(nextMonthStartDay, '');
  const nextMonthEndRange = convertTimeAndDateToTimestamp(nextMonthLastDayString, '23:59');

  try {
    // Clear normal reminders before loading from database for calendar, keep generated reminders
    monthReminders.value = monthReminders.value.filter(reminder => reminder.isGenerated);
    // Read the previous month
    const prevMonthReminders = await readRemindersInRange(prevMonthStartRange, prevMonthEndRange);
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of prevMonthReminders) {
      // Update reminders list
      const result = mapDBToUIReminder(reminder, false);
      // push into monthReminders so the calendar uses these events
      monthReminders.value.push(result);
    }

    // Read the current month
    const rows = await readRemindersInRange(startRange, endRange);
    // Convert each reminder in range from response to UI reminder format 
    for (const reminder of rows) {
      // Update reminders list
      const result = mapDBToUIReminder(reminder, false);
      // push into monthReminders so the calendar uses these events
      monthReminders.value.push(result);
    }

    // Read the next month
    const nextMonthReminders = await readRemindersInRange(nextMonthStartRange, nextMonthEndRange);
    for (const reminder of nextMonthReminders) {
      const result = mapDBToUIReminder(reminder, false);
      monthReminders.value.push(result);
    }
    } catch (error) {
    console.error('Error loading reminders for month:', error);
  } 
}

// Load generated reminders for the current viewable calendar month 
// QCalendar shows days from the previous, current, and next month so all events in this range must be loaded for display
async function loadGeneratedReminders(dateString: string) {
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
  const startDayOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day of the month - ex. 2025-11-30
  // Date returns the day before the first day of the next month (always the last day - ex. 30 for Nov, 31 for Dec, 28 for Feb)
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const lastDayString = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  // Convert to qcalendar timestamps
  const startRange = convertTimeAndDateToTimestamp(startDayOfMonth, '');
  const endRange = convertTimeAndDateToTimestamp(lastDayString, '23:59');

  // Build start and end timestamps for previous month
  // If previous month is January, roll over to December of the previous year. Otherwise, decrement the month and stay in the year
  const prevMonth = (month === 1) ? 12 : month - 1;
  const prevYear = (month === 1) ? year - 1 : year;
  const prevMonthStartDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthLastDayString = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevMonthLastDay).padStart(2, '0')}`;
  const prevMonthStartRange = convertTimeAndDateToTimestamp(prevMonthStartDay, '');
  const prevMonthEndRange = convertTimeAndDateToTimestamp(prevMonthLastDayString, '23:59');

  // Build start and end timestamps for next month 
  // If month is December, roll over to January of the next year. Otherwise, increment the month and stay in the year
  const nextMonth = (month === 12) ? 1 : month + 1;
  const nextYear = (month === 12) ? year + 1 : year;
  const nextMonthStartDay = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const nextMonthLastDay = new Date(nextYear, nextMonth, 0).getDate();
  const nextMonthLastDayString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextMonthLastDay).padStart(2, '0')}`;
  const nextMonthStartRange = convertTimeAndDateToTimestamp(nextMonthStartDay, '');
  const nextMonthEndRange = convertTimeAndDateToTimestamp(nextMonthLastDayString, '23:59');

  try {
    // Clear existing generated reminders before reloading fresh ones from database to avoid duplicate display
    // Therefore, keep items that are not generated and filter out generated ones
    reminders.value = reminders.value.filter(reminder => !reminder.isGenerated);
    monthReminders.value = monthReminders.value.filter(reminder => !reminder.isGenerated);

     // Read the previous month
    const prevMonthReminders = await readGeneratedRemindersInRange(prevMonthStartRange, prevMonthEndRange);
    // Convert each generated reminder in range from response to UI reminder format 
    for (const generatedReminder of prevMonthReminders) {
      // Map to UI and push to middle list (reminders array)
      const result = mapDBGeneratedToUIReminder(generatedReminder, true);
      // Push generated reminder to current month calendar view
      monthReminders.value.push(result);
    }

    // Read the viewable calendar month
    const currentMonthReminders = await readGeneratedRemindersInRange(startRange, endRange);
    // Convert each generated reminder in range from response to UI reminder format 
    for (const generatedReminder of currentMonthReminders) {
      // Map to UI and push to middle list (reminders array)
      const result = mapDBGeneratedToUIReminder(generatedReminder, true);
      // Push generated reminder to current month calendar view
      monthReminders.value.push(result);
    }

     // Read the next month
    const nextMonthReminders = await readGeneratedRemindersInRange(nextMonthStartRange, nextMonthEndRange);
    // Convert each generated reminder in range from response to UI reminder format 
    for (const generatedReminder of nextMonthReminders) {
      // Map to UI and push to middle list (reminders array)
      const result = mapDBGeneratedToUIReminder(generatedReminder, true);
      // Push generated reminder to current month calendar view
      monthReminders.value.push(result);
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
    // clear list before reloading so it reflects only entries from the DB
    reminders.value = [];
    const rows = await readRemindersInRange(start, end);
    // convert each note in range from response to UI note format
    for (const reminder of rows) {
      mapDBToUIReminder(reminder, true);
    }
    // sort reminders alphabetically by title for tree 
    reminders.value.sort((a, b) => {return String(a.temporaryTitle ?? a.title ?? '').toLowerCase().localeCompare(String(b.temporaryTitle ?? b.title ?? '').toLowerCase());});
  } catch (error) {
    console.error('Error loading reminders:', error);
  }
}

// Function to load recurring series from DB into UI
async function loadRecurringSeries() {
  // Load recurring series from current year to +/- 10 years
  // Series may be up to 100 years in future, but loading that many series at once is a performance hit
  // Only need to load series in usable range
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  const startRange = convertTimeAndDateToTimestamp(`${startYear}-01-01`, '');
  const endRange = convertTimeAndDateToTimestamp(`${endYear}-12-31`, '23:59');
  try {
    // Load daily reminders
    const rows = await readDailyRemindersInRange(startRange, endRange);
    for (const recurringDailyReminder of rows) {
      mapDBSeriesToUIRecurringReminder(recurringDailyReminder, 'daily', true);
    }
    // Load weekly reminders
    const weeklyRows = await readWeeklyRemindersInRange(startRange, endRange);
    for (const recurringWeeklyReminder of weeklyRows) {
      mapDBSeriesToUIRecurringReminder(recurringWeeklyReminder, 'weekly', true);
    } 
    // Load monthly reminders
    const monthlyRows = await readMonthlyRemindersInRange(startRange, endRange);
    for (const recurringMonthlyReminder of monthlyRows) {
      mapDBSeriesToUIRecurringReminder(recurringMonthlyReminder, 'monthly', true);
    } 
    // Load yearly reminders
    const yearlyRows = await readYearlyRemindersInRange(startRange, endRange);
    for (const recurringYearlyReminder of yearlyRows) {
      mapDBSeriesToUIRecurringReminder(recurringYearlyReminder, 'yearly', true);
    }
  } catch (error) {
    console.error('Error loading recurring series:', error);
  }
}


// Function to add a note to the list
function addNote() {
  // create a UI-only draft note with a temporary negative bigint ID
  const tempID = tempIDCounter--;
   // Folder to save note in is either root by default if nothing is selected, otherwise selected folder in tree
  const folderID = normalizeFolderID(selectedFolderID.value, notes.value, reminders.value, folders.value) ?? 0n;

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
      // Refresh folder list after creating root folder
      await readAllFolders();
    }
    else {
      // Root folder already exists
    }
  }
  catch (error) {
    console.error('Error adding root folder:', error);
  }
}

// Mapper functions to map database rows to UI
// Map a DB reminder row into the UI reminder shape needed for card display
// Additional upsert parameter decides whether to add/update the global reminders array
function mapDBToUIReminder(row: Reminder, upsert: boolean): UIReminder {
  // Create a date in local timezone from DB row for UI so filtered reminderlist only shows entries whose event date match the calendar date
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
    extension: extensionsUI,
    // Normal reminders have no recurrence type
    originalRecurrenceType: null,
    originalGeneratedTimestamp: null,
    temporaryEventStartTime: startStr,
    temporaryEventEndTime: endStr,
    temporaryEventEndDay: normalizeDatePickerToCalendar(endDateString) ?? dateString, // Default end day is same as start day (not multi-day)
    temporaryEventEndDateEnabled: isMultiDayEvent, // Default not multi-day event
    temporaryNotificationTime: minutesBeforeStartTime,
    temporaryLastModified: lastModifiedTimeAndDate,
    date: normalizeDatePickerToCalendar(dateString) ?? dateString,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    isRecurring: false,
    isConverting: false,
    isGenerated: false,
    linkedParentSeriesID: null,
    expanded: true
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

// Map a DB generated reminder row into the UI reminder shape needed for card display
// Additional upsert parameter decides whether to add/update the global reminders array
function mapDBGeneratedToUIReminder(row: GeneratedReminder, upsert: boolean): UIReminder {
  // Create a date in local timezone from DB row for UI so filtered reminder list only shows entries whose event date match the calendar date
  // Get minute of day, event day, and event year from DB row
  const minuteOfDay = Number(row.eventStartMin);
  const eventDay = Number(row.eventStartDay);
  const eventYear = Number(row.eventStartYear);
  // Start at january 1st of event year and add days to get the right month/day
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


  // Create a timestamp from original DB year, day, min to use in overrides
  const originalMinuteOfDay = Number(row.origEventStartMin);
  const originalDay = Number(row.origEventStartDay);
  const originalYear = Number(row.origEventStartYear);
  const originalDate = new Date(originalYear, 0, 1);
  originalDate.setDate(originalDate.getDate() + (originalDay - 1));
  const origTimeString = minutesToHHMM(originalMinuteOfDay);
  const origDateString = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;
  // Convert date to timestamp
  const originalTimestamp = convertTimeAndDateToTimestamp(origDateString, origTimeString);


  // UI reminder extension fields as a record, these are the actual values taken from frontend input fields 
  const extensionsUI = {} as Record<string, string | number | null | undefined>;

  // DB reminder row with extensions
  const extensionsArr = (row as GeneratedReminder & { extensions?: Extension[] }).extensions;

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
    // Give generated their own unique IDs (different from parent series in frontend for UI functionality and prevent duplicate issues)
    // UI ID is a combination of itemID bigint with the generated reminders original event date
    itemID: BigInt(`${row.itemID}${row.origEventStartYear}${row.origEventStartDay}${row.origEventStartMin}`),
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    temporaryFolderID: row.folderID == null ? null : ((typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID)),
    // Generated do not have lastModified field, set to current time for storage
    lastModified: BigInt(Date.now()),
    // Add on UI specific fields
    temporaryTitle: row.title ?? '',
    extension: extensionsUI,
    // Normal reminders have no recurrence type
    originalRecurrenceType: null,
    originalGeneratedTimestamp: originalTimestamp,
    temporaryEventStartTime: startStr,
    temporaryEventEndTime: endStr,
    temporaryEventEndDay: normalizeDatePickerToCalendar(endDateString) ?? dateString, // Default end day is same as start day (not multi-day)
    temporaryEventEndDateEnabled: false, // Generated are not multi-day (as series doesn't support it fully)
    temporaryNotificationTime: minutesBeforeStartTime,
    temporaryLastModified: '',
    date: normalizeDatePickerToCalendar(dateString) ?? dateString,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    isRecurring: false,
    isConverting: false,
    isGenerated: true,
    // Generated itemIDs are the parent series ID, store it to link back to parent series
    linkedParentSeriesID: (typeof row.itemID === 'bigint') ? row.itemID : BigInt(row.itemID),
    expanded: true
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

// Map a DB recurring reminder row into the UI reminder shape needed for card display
// Additional upsert parameter decides whether to add/update the global reminders array
function mapDBSeriesToUIRecurringReminder(row: DailyReminder | WeeklyReminder | MonthlyReminder | YearlyReminder, recurrenceType: 'daily' | 'weekly' | 'monthly' | 'yearly', upsert: boolean): UIReminder {
  // All recurring reminders have these fields so their evaluation can go before the recurrence object building
  // Compute series start date from DB row to display
  // Get series start year,day, and min from DB row 
  const seriesStartYear = Number(row.seriesStartYear);
  const seriesStartDay = Number(row.seriesStartDay);
  const seriesStartMin = Number(row.seriesStartMin);

  // Start at january 1st of series year and add days to get the right month/day
  const startDate = new Date(seriesStartYear, 0, 1);
  startDate.setDate(startDate.getDate() + (seriesStartDay - 1));

  // Convert date to YYYY-MM-DD string format compatible with qcalendar/selectedDate
  const dateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

  // Compute series end date from DB row to display
  // Get series end year,day, and min from DB row
  const seriesEndYear = Number(row.seriesEndYear);
  const seriesEndDay = Number(row.seriesEndDay);
  const seriesEndMin = Number(row.seriesEndMin);
  const endDate = new Date(seriesEndYear, 0, 1);
  endDate.setDate(endDate.getDate() + (seriesEndDay - 1));
  const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  // Get last modified and convert for display
  const lastModifiedEpoch = Number(row.lastModified);
  const recurringReminderDate = new Date(lastModifiedEpoch);
  const lastModifiedTimeAndDate = recurringReminderDate.toLocaleString();

  // Build recurrence object for UI based on recurrence type
  let recurrence: UIReminder['recurrence'] = null;

  // Determine notification offset display dependent on if recurring reminder has notifications
  const notificationOffset = row.notifOffsetTimeMin;
  const hasNotification = row.hasNotifs;
  // If notification flag is set, convert the notificaiton offset to display or null for never
  const UINotificationOffset = hasNotification ? Math.abs(notificationOffset ?? 0) : null;

  if (recurrenceType === 'daily') {
    // If recurrence type is daily, treat DB row as daily reminder schema
    const dailyReminder = row as DailyReminder;
    recurrence = {
      type: 'daily',
      daily: {
        timeOfDayMin: dailyReminder.timeOfDayMin,
        eventDurationMin: dailyReminder.eventDurationMin,
        notifOffsetTimeMin: UINotificationOffset,
        everyNDays: dailyReminder.everyNDays,
        seriesEndDate: normalizeDatePickerToCalendar(endDateString) ?? endDateString
      }
    };
  }

  else if (recurrenceType === 'weekly') {
    // If recurrence type is weekly, treat DB row as weekly reminder schema
    const weeklyReminder = row as WeeklyReminder;

    // Extract daysOfWeek array back from DB stored 7-char string to display in dropdown
    const daysOfWeekArray: number[] = [];
        // Fill empty array by iterating over each character in the string
        // If the character at the index is '1', that day is selected, push its index
        for (let i = 0; i < 7; i++) {
          if (weeklyReminder.daysOfWeek.charAt(i) === '1') {
            daysOfWeekArray.push(i);
          }
        }

    recurrence = {
      type: 'weekly',
      weekly: {
        timeOfDayMin: weeklyReminder.timeOfDayMin,
        eventDurationMin: weeklyReminder.eventDurationMin,
        notifOffsetTimeMin: UINotificationOffset,
        everyNWeeks: weeklyReminder.everyNWeeks,
        daysOfWeek: daysOfWeekArray,
        seriesEndDate: normalizeDatePickerToCalendar(endDateString) ?? endDateString
      }
    };
  }

  else if (recurrenceType === 'monthly') {
    // If recurrence type is monthly, treat DB row as monthly reminder schema
    const monthlyReminder = row as MonthlyReminder;

     // Extract daysOfMonth array back from DB stored 31-char string to display in grid
    const daysOfMonthArray: number[] = [];
        // Fill empty array by iterating over each character in the string
        // If the character at the index is '1', that day is selected, push its index
        for (let i = 0; i < 31; i++) {
          if (monthlyReminder.daysOfMonth.charAt(i) === '1') {
            daysOfMonthArray.push(i + 1);
          }
        }
    recurrence = {
      type: 'monthly',
      monthly: {
        timeOfDayMin: monthlyReminder.timeOfDayMin,
        eventDurationMin: monthlyReminder.eventDurationMin,
        notifOffsetTimeMin: UINotificationOffset,
        // When DB value exists, convert to boolean 
        lastDayOfMonth: Boolean(monthlyReminder.lastDayOfMonth),
        daysOfMonth: daysOfMonthArray,
        seriesEndDate: normalizeDatePickerToCalendar(endDateString) ?? endDateString
      }
    };
  }

   else if (recurrenceType === 'yearly') {
    // If recurrence type is yearly, treat DB row as yearly reminder schema
    const yearlyReminder = row as YearlyReminder;
    const recurDay = Number(yearlyReminder.dayOfYear);
    const recurYear = Number(yearlyReminder.seriesStartYear);
    
    // Convert dayOfYear from database back to full date string for display
    // Backend only returns dayOfYear, which does not include the original year the user chose, only day and month
    // Therefore, use series start year as the display year

    // Make new date on Jan 1st in series start year
    let recurDate = new Date(recurYear, 0, 1);
    // Add dayOfYear days to get the correct month/day the user chose
    recurDate.setDate(recurDate.getDate() + (recurDay - 1));
    // If dayOfYear is Feb 29 on a leap year, but the series start year isnt a leap year, fallback display date to Feb 28 to not display invalid date
    if (recurDay == 366 && !isLeapYear(recurYear)) {
      recurDate = new Date(recurYear, 1, 28);
    }
    // Convert date to YYYY-MM-DD string format compatible with qcalendar/selectedDate
    const recurDateString = `${recurDate.getFullYear()}-${String(recurDate.getMonth() + 1).padStart(2, '0')}-${String(recurDate.getDate()).padStart(2, '0')}`;
    
    recurrence = {
      type: 'yearly',
      yearly: {
        timeOfDayMin: yearlyReminder.timeOfDayMin,
        eventDurationMin: yearlyReminder.eventDurationMin,
        notifOffsetTimeMin: UINotificationOffset,
        dayOfYear: normalizeDatePickerToCalendar(recurDateString),
        seriesEndDate: normalizeDatePickerToCalendar(endDateString) ?? endDateString
      }
    };
  }

  // UI reminder extension fields as a record, these are the actual values taken from frontend input fields 
  const extensionsUI = {} as Record<string, string | number | null | undefined>;

  // DB reminder row with extensions
  const extensionsArr = (row as DailyReminder | WeeklyReminder | MonthlyReminder | YearlyReminder & { extensions?: Extension[] }).extensions;

  // If extensions array exists, map each extension into extensions UI record
  if (extensionsArr && extensionsArr.length > 0) {
    // If a flight, extract flight fields
    if (row.eventType === 1) {
      const flightFields = ExtensionsToFlight(extensionsArr);;
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
    // Copy all fields from DB shared type (daily, weekly, monthly, or yearly depending on what recurrence was passed in)
    ...row,
    // normalize itemID and folder IDs to bigint so they match folder IDs used by the tree
    itemID: (typeof row.itemID === 'bigint') ? row.itemID : BigInt(row.itemID),
    folderID: (typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID),
    temporaryFolderID: row.folderID == null ? null : ((typeof row.folderID === 'bigint') ? row.folderID : BigInt(row.folderID)),
    // Add on UI specific fields
    temporaryTitle: row.title ?? '',
    extension: extensionsUI,
    // Get recurrence type from DB row loaded into the UI
    originalRecurrenceType: recurrence?.type ?? recurrenceType,
    originalGeneratedTimestamp: null,
    // Event start time, end time, end day, end date are all unique to non-recurring reminders, override these fields for recurring 
    temporaryEventStartTime: '',
    temporaryEventEndTime: '',
    temporaryEventEndDay: '', // No multi-day support for recurring
    temporaryEventEndDateEnabled: false, // No multi-day support for recurring
    // Temp notification time is same as notifOffsetTimeMin for recurring reminders (but positive)
    temporaryNotificationTime: UINotificationOffset,
    eventStartYear: row.seriesStartYear,
    eventStartDay: row.seriesStartDay,
    eventStartMin: row.seriesStartMin,
    eventEndYear: row.seriesEndYear,
    eventEndDay: row.seriesEndDay,
    eventEndMin: row.seriesEndMin,
    notifYear: 0,
    notifDay: 0,
    notifMin: 0,
    hasNotif: row.hasNotifs,
    temporaryLastModified: lastModifiedTimeAndDate,
    date: normalizeDatePickerToCalendar(dateString) ?? dateString,
    titleMessageError: '',
    folderMessageError: '',
    timeMessageError: '',
    isSaved: true,
    isEditing: false,
    isSelected: false,
    recurrence: recurrence,
    isRecurring: true,
    isConverting: false,
    isGenerated: false,
    linkedParentSeriesID: null,
    expanded: true
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
    colorCode: Number(row.colorCode ?? convertHexToInt('#459DD8')),        // existing DB numeric field
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

async function load(){
  // Add root folder if no folders exist on page load
    await addRootFolder();
    // Ensure folders array is populated from local DB on page load
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Load all reminders and notes for file explorer tree
    await loadReminders();
    await loadNotes();
    // Load recurring series for file explorer tree
    await loadRecurringSeries();
    // Load reminders for selected calendar date on startup for tab list
    await loadRemindersForCalendarDate(selectedDate.value);
    // Load reminders for the visible month for calendar events
    await loadRemindersForMonth(selectedDate.value);
    // Load generated reminders for visible and next month
    await loadGeneratedReminders(selectedDate.value);
}


onMounted(async () => {
  isLoggedIn.value = await window.electronAuthAPI.isUserLoggedIn();
  console.log('App mounted');
  console.log('onMounted', isLoggedIn.value);
  isCloudOn.value = false;
  if (isLoggedIn.value) {
    // Since sync initiates on startup, set cloud toggle to on
    isCloudOn.value = true;
     // Start initial sync on app load
    await onToggleCloudSync();
  }else{
    await load();
  }
 
  });


// Function to add a folder to the tree
function addFolder() {
   // Create a UI-only draft folder with a temporary negative bigint ID
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
  // Check for a folder where the parent folder ID exists in the folders array (or 0 for root)
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

// General function to validate and save recurring reminder when save button is clicked
// Calls other functions to save dependent on their type
// Returns true if successful (passed validation and saved DB entry), false if not
async function saveRecurringReminder(reminder: UIReminder) {
  // Clear previous errors before re-validating
  reminder.titleMessageError = '';
  reminder.folderMessageError = '';
  reminder.timeMessageError = '';

  // Not a recurring reminder
  if (!reminder.recurrence || !reminder.isRecurring) {
    return false;
  }

    // Clear extension fields for recurring series to ensure the times are built off recurrence rules (in case reminder was normal before)
    reminder.extension = reminder.extension ?? {};
    ['depTime','arrTime','checkinTime','checkoutTime','boardingTime'].forEach(fieldKey => {
      if (fieldKey in reminder.extension) {
        // Null will cause it to go to the recurrence check in buildExtensionsForEventType
        reminder.extension[fieldKey] = null;
      }
    });

  // Build event type extensions from UI fields
  const extensions = buildExtensionsForEventType(reminder);
  // Only send an extension if there are fields to send (otherwise undefined so DB doesn't make an extension)
  const extensionsToSend = (extensions && extensions.length > 0) ? extensions : undefined;

  // Validaiton common to all recurrence types
  // Make sure recurring reminder is saved in preexisting folder
  if (reminder.temporaryFolderID == null || !folders.value.some(folder => String(folder.folderID) === String(reminder.temporaryFolderID))) {
    reminder.folderMessageError = 'Reminder must be in a existing folder.';
    return false;
  }

  // eventType must be integer value
  if (!Number.isInteger(reminder.eventType)) {
    reminder.titleMessageError = 'Invalid event type selected.';
    return false;
  }

  // Depending on recurrence type, call its save function (specific validation)
  if (reminder.recurrence.type === 'daily') {
    return await saveDailyReminder(reminder, extensionsToSend);
  } else if (reminder.recurrence.type === 'weekly') {
    return await saveWeeklyReminder(reminder, extensionsToSend);
  }
  else if (reminder.recurrence.type === 'monthly') {
    return await saveMonthlyReminder(reminder, extensionsToSend);
  }
   else if (reminder.recurrence.type === 'yearly') {
    return await saveYearlyReminder(reminder, extensionsToSend);
  }
  
  
  // If no matching type, return false
  return false;
}

// Function to validate and save daily recurring reminders
async function saveDailyReminder(reminder: UIReminder, extensionsToSend: Extension[] | undefined): Promise<boolean> {
  if (!reminder.recurrence?.daily) {
    reminder.timeMessageError = 'Daily recurrence settings are missing.';
    return false;
  }

  const startTime = normalizeDatePickerToCalendar(reminder.date) ?? reminder.date;
  const endTime = normalizeDatePickerToCalendar(reminder.recurrence.daily.seriesEndDate) ?? reminder.recurrence.daily.seriesEndDate;
  const seriesStartTime = convertTimeAndDateToTimestamp(startTime, '00:00');
  const seriesEndTime = convertTimeAndDateToTimestamp(endTime, '23:59');

  // Compare exact moment in time if series start time is before series end time, if not, error
  const startEpoch = timeStamptoEpoch(seriesStartTime);
  const endEpoch = timeStamptoEpoch(seriesEndTime);
  if (endEpoch < startEpoch) {
    reminder.timeMessageError = 'Start time must be before end time.';
    return false;
  }

  // End day must be provided
  if (!reminder.recurrence.daily.seriesEndDate) {
    reminder.timeMessageError = 'Please select a valid event end date for series.';
    return false;
  }

  // timeOfDayMin must be between 0 and 1439 (start and end of day)
  if (!Number.isInteger(reminder.recurrence.daily.timeOfDayMin) || reminder.recurrence.daily.timeOfDayMin < 0 || reminder.recurrence.daily.timeOfDayMin > 1439) {
    reminder.timeMessageError = 'Event time must be within the start and end of the day (0 to 1439).';
    return false;
  }

  // Event duration must be positive (zero for instant event)
  if (!Number.isInteger(reminder.recurrence.daily.eventDurationMin) || reminder.recurrence.daily.eventDurationMin < 0) {
    reminder.timeMessageError = 'Event duration must be positive (0 for instant events).';
    return false;
  }

  // Event duration cannot be more than a day
  if (reminder.recurrence.daily.eventDurationMin > 1440) {
    reminder.timeMessageError = 'Event duration cannot be more than a day.';
    return false;
  }

  // everyNDays must not be less than 1
  if (!Number.isInteger(reminder.recurrence.daily.everyNDays) || reminder.recurrence.daily.everyNDays < 1) {
    reminder.timeMessageError = 'Recurrence interval must be greater than 1.';
    return false;
  }

  // Check that frequency (everyNDays) fits in the series range
  // Prevents recurring series that make no generated reminders (ex. series range is 2 days but frequency is every 3 days)
  // Convert ms in time (epoch) to number of days in the series range
  const msPerDay = 1000 * 60 * 60 * 24;
  // Add 1 to include start and end date in the series length
  const seriesLength = Math.floor((endEpoch - startEpoch) / msPerDay) + 1;

  if (reminder.recurrence.daily.everyNDays > seriesLength) {
    reminder.timeMessageError = 'Frequency must fit within series length.';
    return false;
  }

  // Assign local variables for DB saving
  const timeOfDayMin = reminder.recurrence.daily.timeOfDayMin;
  const eventDurationMin = reminder.recurrence.daily.eventDurationMin;
  // As long as its not 'never' (null), notification is set
  const recurringNotifOffset = reminder.recurrence.daily.notifOffsetTimeMin == null ? 0 : -Math.abs(reminder.recurrence.daily.notifOffsetTimeMin);
  const hasNotification = reminder.recurrence.daily.notifOffsetTimeMin != null;
  const everyNDays = reminder.recurrence.daily.everyNDays;
  // folderID already checked in saveRecurringReminder, cast to non-null bigint folder ID to save
  const folderID: bigint = reminder.temporaryFolderID!;

  // Save a daily recurring reminder in DB
  // Recurring reminder not saved to DB yet, create it
  if (!reminder.isSaved) {
    const seriesID = await createDailyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, everyNDays, reminder.temporaryTitle, extensionsToSend);

    // Make sure draft ID matches DB ID so it gets replaced in UI
    reminder.itemID = seriesID;
    reminder.isSaved = true;

    // Fetch the newly created recurring reminder from the DB
    const row = await readDailyReminder(seriesID);

    // Map recurring reminder to UI format
    if (row) {
      mapDBSeriesToUIRecurringReminder(row, 'daily', true);
    }

    // Reload generated reminders after new series creation to immediately show new items
    await loadGeneratedReminders(selectedDate.value);

    // Load folders after creation
    folders.value = mapDBToUIFolder(await readAllFolders());
    reminder.timeMessageError = '';
    return true;
  } else {
    // Recurring reminder saved before, update it
    const originalRecurrenceType = reminder.originalRecurrenceType;
    // Original recurrence type exists, so update existing recurring reminder
    if (originalRecurrenceType) {
      await updateDailyReminder(reminder.itemID, folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, everyNDays, reminder.temporaryTitle, extensionsToSend);

      // Fetch the updated recurring reminder from the DB
      const row = await readDailyReminder(reminder.itemID);

      // Map recurring reminder to UI format
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'daily', true);
      }

     // Reload generated reminders after new series update to immediately show updated items
     await loadGeneratedReminders(selectedDate.value);

      folders.value = mapDBToUIFolder(await readAllFolders());
      reminder.timeMessageError = '';
      return true;
    } else {
      // Original recurrence type is null, reminder is normal, convert it to a series
      // Create new series reminder
      const seriesID = await createDailyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, everyNDays, reminder.temporaryTitle, extensionsToSend);
      // Delete old normal reminder
      await deleteItem(reminder.itemID, 12);
      const row = await readDailyReminder(seriesID);
      // Map recurring reminder to UI format
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'daily', true);
      }

      // Remove old normal reminder from UI, keep all other entries
      reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));

      // Reload generated reminders after new series creation to immediately show new items
      await loadGeneratedReminders(selectedDate.value);

      folders.value = mapDBToUIFolder(await readAllFolders());
      await loadRemindersForCalendarDate(selectedDate.value);
      await loadRemindersForMonth(selectedDate.value);
      reminder.timeMessageError = '';
      return true;
    }
  }
}

// Function to validate and save weekly recurring reminders
async function saveWeeklyReminder(reminder: UIReminder, extensionsToSend: Extension[] | undefined): Promise<boolean> {
  if (!reminder.recurrence?.weekly) {
    reminder.timeMessageError = 'Weekly recurrence settings are missing.';
    return false;
  }

  // Set series times (local to this function)
  const startTime = normalizeDatePickerToCalendar(reminder.date) ?? reminder.date;
  const endTime = normalizeDatePickerToCalendar(reminder.recurrence.weekly.seriesEndDate) ?? reminder.recurrence.weekly.seriesEndDate;
  const seriesStartTime = convertTimeAndDateToTimestamp(startTime, '00:00');
  const seriesEndTime = convertTimeAndDateToTimestamp(endTime, '23:59');

  // Compare exact moment in time if series start time is before series end time, if not, error
  const startEpoch = timeStamptoEpoch(seriesStartTime);
  const endEpoch = timeStamptoEpoch(seriesEndTime);
  if (endEpoch < startEpoch) {
    reminder.timeMessageError = 'Start time must be before end time.';
    return false;
  }

  // End day must be provided
  if (!reminder.recurrence.weekly.seriesEndDate) {
    reminder.timeMessageError = 'Please select a valid event end date for series.';
    return false;
  }

  // timeOfDayMin must be between 0 and 1439 (start and end of day)
  if (!Number.isInteger(reminder.recurrence.weekly.timeOfDayMin) || reminder.recurrence.weekly.timeOfDayMin < 0 || reminder.recurrence.weekly.timeOfDayMin > 1439) {
    reminder.timeMessageError = 'Event time must be within the start and end of the day (0 to 1439).';
    return false;
  }

  // Event duration must be positive (zero for instant event)
  if (!Number.isInteger(reminder.recurrence.weekly.eventDurationMin) || reminder.recurrence.weekly.eventDurationMin < 0) {
    reminder.timeMessageError = 'Event duration must be positive (0 for instant events).';
    return false;
  }

  // Event duration cannot be more than a day
  if (reminder.recurrence.weekly.eventDurationMin > 1440) {
    reminder.timeMessageError = 'Event duration cannot be more than a day.';
    return false;
  }

  // everyNWeeks must not be less than 1
  if (!Number.isInteger(reminder.recurrence.weekly.everyNWeeks) || reminder.recurrence.weekly.everyNWeeks < 1) {
    reminder.timeMessageError = 'Recurrence interval must be greater than 1.';
    return false;
  }

  // Convert day of weeks array into backend 7-char string for database storage
  // Flag '1' for event that day (selected) and '0' for no event that day (not selected)
  // Days of week array is set from the q-select dropdown menu containing each days index (ex. [0, 2] where 0 = Sunday, 2 = Tuesday were chosen)

  // Initialize 7-char string as a char array with all 0's (no selection)
  // ['0', '0', '0', '0', '0', '0', '0'] where all days are unselected by default
  const daysOfWeekString = Array(7).fill('0');

  // Loop through each selected day of the weeks indices
  reminder.recurrence.weekly.daysOfWeek.forEach((index) => {
    // Ensure index is in range
    if (index >= 0 && index < 7) {
      // For each selected day, set flag to 1
      daysOfWeekString[index] = '1';
    }
  });
  // Join char array into a single string to store in database
  const daysOfWeekDatabaseString = daysOfWeekString.join('');

  // Make sure at least one weekday is selected
  if (reminder.recurrence.weekly.daysOfWeek.length === 0) {
    reminder.timeMessageError = 'Please select at least one day of the week for the event to occur.';
    return false;
  }

  // Assign variables for DB saving
  const timeOfDayMin = reminder.recurrence.weekly.timeOfDayMin;
  const eventDurationMin = reminder.recurrence.weekly.eventDurationMin;
  // Notification is set as long as its not 'never' (null)
  const recurringNotifOffset = reminder.recurrence.weekly.notifOffsetTimeMin == null ? 0 : -Math.abs(reminder.recurrence.weekly.notifOffsetTimeMin);
  const hasNotification = reminder.recurrence.weekly.notifOffsetTimeMin != null;
  const everyNWeeks = reminder.recurrence.weekly.everyNWeeks;
  // folderID already checked in saveRecurringReminder, cast to non-null bigint folder ID to save
  const folderID: bigint = reminder.temporaryFolderID!;


  // Recurring reminder not saved to DB yet, create it
  if (!reminder.isSaved) {
    const seriesID = await createWeeklyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, everyNWeeks, daysOfWeekDatabaseString, reminder.temporaryTitle, extensionsToSend);
    // Make sure draft ID matches DB ID so it gets replaced in UI
    reminder.itemID = seriesID;
    reminder.isSaved = true;

    // Fetch the newly created recurring reminder from the DB
    const row = await readWeeklyReminder(seriesID);

    // Map recurring reminder to UI format
    if (row) {
      mapDBSeriesToUIRecurringReminder(row, 'weekly', true);
    }

    // Reload generated reminders after new series creation to immediately show new items
    await loadGeneratedReminders(selectedDate.value);

    // Load folders after creation
    folders.value = mapDBToUIFolder(await readAllFolders());
    reminder.timeMessageError = '';
    return true;
  } else {
    // Recurring reminder saved before, update it
    const originalRecurrenceType = reminder.originalRecurrenceType;
    // Original recurrence type exists, so update existing recurring reminder
    if (originalRecurrenceType) {
      await updateWeeklyReminder(reminder.itemID, folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, everyNWeeks, daysOfWeekDatabaseString, reminder.temporaryTitle, extensionsToSend);

      // Fetch the updated recurring reminder from the DB
      const row = await readWeeklyReminder(reminder.itemID);

      // Map recurring reminder to UI format
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'weekly', true);
      }

      // Reload generated reminders after new series update to immediately show updated items
      await loadGeneratedReminders(selectedDate.value);

      folders.value = mapDBToUIFolder(await readAllFolders());
      reminder.timeMessageError = '';
      return true;
    } else {
      // Original recurrence type is null, reminder is normal, convert it to a series
      // Create new series reminder
      const seriesID = await createWeeklyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, everyNWeeks, daysOfWeekDatabaseString, reminder.temporaryTitle, extensionsToSend);
      // Delete old normal reminder
      await deleteItem(reminder.itemID, 12);
      const row = await readWeeklyReminder(seriesID);
      // Map recurring reminder to UI format
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'weekly', true);
      }

      // Remove old normal reminder from UI, keep all other entries
      reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));

      // Reload generated reminders after new series creation to immediately show new items
      await loadGeneratedReminders(selectedDate.value);

      folders.value = mapDBToUIFolder(await readAllFolders());
      await loadRemindersForCalendarDate(selectedDate.value);
      await loadRemindersForMonth(selectedDate.value);
      reminder.timeMessageError = '';
      return true;
    }
  }
}

// Function to validate and save monthly recurring reminders
async function saveMonthlyReminder(reminder: UIReminder, extensionsToSend: Extension[] | undefined): Promise<boolean> {
  if (!reminder.recurrence?.monthly) {
    reminder.timeMessageError = 'Monthly recurrence settings are missing.';
    return false;
  }

  const startTime = normalizeDatePickerToCalendar(reminder.date) ?? reminder.date;
  const endTime = normalizeDatePickerToCalendar(reminder.recurrence.monthly.seriesEndDate) ?? reminder.recurrence.monthly.seriesEndDate;
  const seriesStartTime = convertTimeAndDateToTimestamp(startTime, '00:00');
  const seriesEndTime = convertTimeAndDateToTimestamp(endTime, '23:59');

  // Compare exact moment in time if series start time is before series end time, if not, error
  const startEpoch = timeStamptoEpoch(seriesStartTime);
  const endEpoch = timeStamptoEpoch(seriesEndTime);
  if (endEpoch < startEpoch) {
    reminder.timeMessageError = 'Start time must be before end time.';
    return false;
  }

  // End day must be provided
  if (!reminder.recurrence.monthly.seriesEndDate) {
    reminder.timeMessageError = 'Please select a valid event end date for series.';
    return false;
  }

  // timeOfDayMin must be between 0 and 1439 (start and end of day)
  if (!Number.isInteger(reminder.recurrence.monthly.timeOfDayMin) || reminder.recurrence.monthly.timeOfDayMin < 0 || reminder.recurrence.monthly.timeOfDayMin > 1439) {
    reminder.timeMessageError = 'Event time must be within the start and end of the day (0 to 1439).';
    return false;
  }

  // Event duration must be positive (zero for instant event)
  if (!Number.isInteger(reminder.recurrence.monthly.eventDurationMin) || reminder.recurrence.monthly.eventDurationMin < 0) {
    reminder.timeMessageError = 'Event duration must be positive (0 for instant events).';
    return false;
  }

  // Event duration cannot be more than a day
  if (reminder.recurrence.monthly.eventDurationMin > 1440) {
    reminder.timeMessageError = 'Event duration cannot be more than a day.';
    return false;
  }

  // Extract numeric selected days from full date strings in DaysOfMonthSelection
  const selectedDaysOfMonth: number[] = (DaysOfMonthSelection.value ?? []).map(dateString => {
    const parts = dateString.split('/');
    const dayPart = parts[2] ?? '';
    return parseInt(dayPart, 10);
  }).filter(dayNumber => Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 31);


  // Initialize 31-char string as a char array with all 0's (no selection)
  // ['0', '0', '0', '0', '0', '0', '0'] where all days of the month are unselected by default
  const daysOfMonthString = Array(31).fill('0');

  // Loop through each selected day of the month
  selectedDaysOfMonth.forEach((index) => {
    // Ensure index is in range
    if (index >= 0 && index <= 31) {
      // For each selected day, set flag to 1
      daysOfMonthString[index - 1] = '1';
    }
  });
  // Join each character into a single string to store in database
  const daysOfMonthDatabaseString = daysOfMonthString.join('');

  // Make sure at least one day of the month is selected
  if (selectedDaysOfMonth.length === 0) {
    reminder.timeMessageError = 'Please select at least one day of the month for the event to occur.';
    return false;
  }

  // Assign local variables for DB saving
  const timeOfDayMin = reminder.recurrence.monthly.timeOfDayMin;
  const eventDurationMin = reminder.recurrence.monthly.eventDurationMin;
  const recurringNotifOffset = reminder.recurrence.monthly.notifOffsetTimeMin == null ? 0 : -Math.abs(reminder.recurrence.monthly.notifOffsetTimeMin);
  const hasNotification = reminder.recurrence.monthly.notifOffsetTimeMin != null;
  const lastDayOfMonth = reminder.recurrence.monthly.lastDayOfMonth;
  const folderID: bigint = reminder.temporaryFolderID!;

  // Recurring reminder not saved to DB yet, create it
  if (!reminder.isSaved) {
    const seriesID = await createMonthlyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, lastDayOfMonth, daysOfMonthDatabaseString, reminder.temporaryTitle, extensionsToSend);

    reminder.itemID = seriesID;
    reminder.isSaved = true;

    // Fetch the newly created recurring reminder from the DB
    const row = await readMonthlyReminder(seriesID);

    // Map recurring reminder to UI format
    if (row) {
      mapDBSeriesToUIRecurringReminder(row, 'monthly', true);
    }

    // Reload generated reminders after new series update to immediately show updated items
    await loadGeneratedReminders(selectedDate.value);

    folders.value = mapDBToUIFolder(await readAllFolders());
    reminder.timeMessageError = '';
    return true;
  } else {
    // Recurring reminder saved before, update it
    const originalRecurrenceType = reminder.originalRecurrenceType;

    if (originalRecurrenceType) {
      // Update existing series in DB
      await updateMonthlyReminder(reminder.itemID, folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, lastDayOfMonth, daysOfMonthDatabaseString, reminder.temporaryTitle, extensionsToSend);

      // Fetch the updated recurring reminder from the DB
      const row = await readMonthlyReminder(reminder.itemID);

      // Map recurring reminder to UI format
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'monthly', true);
      }

      // Reload generated reminders after new series creation to immediately show new items
      await loadGeneratedReminders(selectedDate.value);

      folders.value = mapDBToUIFolder(await readAllFolders());
      reminder.timeMessageError = '';
      return true;

    } else {
      // Original recurrence type is null, reminder is normal, convert it to a series
      // Create new series reminder
      const seriesID = await createMonthlyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, lastDayOfMonth, daysOfMonthDatabaseString, reminder.temporaryTitle, extensionsToSend);

      // Delete old normal reminder
      await deleteItem(reminder.itemID, 12);

      const row = await readMonthlyReminder(seriesID);

      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'monthly', true);
      }

      // Remove old normal reminder from UI, keep all other entries
      reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));

      // Reload generated reminders after new series creation to immediately show new items
      await loadGeneratedReminders(selectedDate.value);
      // Map recurring reminder to UI format
      folders.value = mapDBToUIFolder(await readAllFolders());
      await loadRemindersForCalendarDate(selectedDate.value);
      await loadRemindersForMonth(selectedDate.value);
      reminder.timeMessageError = '';
      return true;
    }
  }
}

// Function to validate and save yearly recurring reminders
async function saveYearlyReminder(reminder: UIReminder, extensionsToSend: Extension[] | undefined): Promise<boolean> {
  if (!reminder.recurrence?.yearly) {
    reminder.timeMessageError = 'Yearly recurrence settings are missing.';
    return false;
  }

  const startTime = normalizeDatePickerToCalendar(reminder.date) ?? reminder.date;
  const endTime = normalizeDatePickerToCalendar(reminder.recurrence.yearly.seriesEndDate) ?? reminder.recurrence.yearly.seriesEndDate;
  const seriesStartTime = convertTimeAndDateToTimestamp(startTime, '00:00');
  const seriesEndTime = convertTimeAndDateToTimestamp(endTime, '23:59');

  // Compare exact moment in time if series start time is before series end time, if not, error
  const startEpoch = timeStamptoEpoch(seriesStartTime);
  const endEpoch = timeStamptoEpoch(seriesEndTime);
  if (endEpoch < startEpoch) {
    reminder.timeMessageError = 'Start time must be before end time.';
    return false;
  }

  // End day must be provided
  if (!reminder.recurrence.yearly.seriesEndDate) {
    reminder.timeMessageError = 'Please select a valid event end date for series.';
    return false;
  }

  // timeOfDayMin must be between 0 and 1439 (start and end of day)
  if (!Number.isInteger(reminder.recurrence.yearly.timeOfDayMin) || reminder.recurrence.yearly.timeOfDayMin < 0 || reminder.recurrence.yearly.timeOfDayMin > 1439) {
    reminder.timeMessageError = 'Event time must be within the start and end of the day (0 to 1439).';
    return false;
  }

  // Event duration must be positive (zero for instant event)
  if (!Number.isInteger(reminder.recurrence.yearly.eventDurationMin) || reminder.recurrence.yearly.eventDurationMin < 0) {
    reminder.timeMessageError = 'Event duration must be positive (0 for instant events).';
    return false;
  }

  // Event duration cannot be more than a day
  if (reminder.recurrence.yearly.eventDurationMin > 1440) {
    reminder.timeMessageError = 'Event duration cannot be more than a day.';
    return false;
  }
  
  const recurDate = normalizeDatePickerToCalendar(reminder.recurrence.yearly.dayOfYear).trim();

  if (!recurDate) {
    reminder.timeMessageError = 'Please select a date for the yearly recurrence.';
    return false;
  }

  // Convert day of year to recur on to timestamp to store in database
  // 00:00 time because only the date is used from this field
  const recurDayTimestamp = convertTimeAndDateToTimestamp(recurDate, '00:00');
  if (!recurDayTimestamp) {
    reminder.timeMessageError = 'Invalid recurrence date.';
    return false;
  }

  // Assign local variables for DB saving
  const timeOfDayMin = reminder.recurrence.yearly.timeOfDayMin;
  const eventDurationMin = reminder.recurrence.yearly.eventDurationMin;
  const recurringNotifOffset = reminder.recurrence.yearly.notifOffsetTimeMin == null ? 0 : -Math.abs(reminder.recurrence.yearly.notifOffsetTimeMin);
  const hasNotification = reminder.recurrence.yearly.notifOffsetTimeMin != null;
  const folderID: bigint = reminder.temporaryFolderID!; 

   // Recurring reminder not saved to DB yet, create it
  if (!reminder.isSaved) {
    const seriesID = await createYearlyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, recurDayTimestamp, reminder.temporaryTitle, extensionsToSend);
    reminder.itemID = seriesID;
    reminder.isSaved = true;

    // Fetch the newly created recurring reminder from the DB
    const row = await readYearlyReminder(seriesID);

    // Map recurring reminder to UI format
    if (row) {
      mapDBSeriesToUIRecurringReminder(row, 'yearly', true);
    }

     // Reload generated reminders after new series creation to immediately show new items
     await loadGeneratedReminders(selectedDate.value);

    folders.value = mapDBToUIFolder(await readAllFolders());
    reminder.timeMessageError = '';
    return true;
  } else {
    // Recurring reminder saved before, update it
    const originalRecurrenceType = reminder.originalRecurrenceType;
    if (originalRecurrenceType) {
      // Update existing series in DB
      await updateYearlyReminder(reminder.itemID, folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, recurDayTimestamp, reminder.temporaryTitle, extensionsToSend);
      // Fetch the updated recurring reminder from the DB
      const row = await readYearlyReminder(reminder.itemID);
      // Map recurring reminder to UI format
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'yearly', true);
      }

      // Reload generated reminders after updated series creation to immediately show updated items
      await loadGeneratedReminders(selectedDate.value);
      folders.value = mapDBToUIFolder(await readAllFolders());
      reminder.timeMessageError = '';
      return true;
    } else {
      // Original recurrence type is null, reminder is normal, convert it to a series
      // Create new series reminder
      const seriesID = await createYearlyReminder(folderID, reminder.eventType, seriesStartTime, seriesEndTime, timeOfDayMin, eventDurationMin, recurringNotifOffset, hasNotification, recurDayTimestamp, reminder.temporaryTitle, extensionsToSend);
      // Delete old normal reminder
      await deleteItem(reminder.itemID, 12);
      const row = await readYearlyReminder(seriesID);
      if (row) {
        mapDBSeriesToUIRecurringReminder(row, 'yearly', true);
      }

      // Remove old normal reminder from UI, keep all other entries
      reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));

      // Reload generated reminders after new series creation to immediately show new items
      await loadGeneratedReminders(selectedDate.value);
      // Map recurring reminder to UI format
      folders.value = mapDBToUIFolder(await readAllFolders());
      await loadRemindersForCalendarDate(selectedDate.value);
      await loadRemindersForMonth(selectedDate.value);
      reminder.timeMessageError = '';
      return true;
    }
  }
}

// Function to save reminder fields when save button is clicked
async function saveReminder(reminder: UIReminder){
  // Clear errors before re-validating
  reminder.titleMessageError = '';
  reminder.folderMessageError = '';
  reminder.timeMessageError = '';

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
  if (!Number.isInteger(reminder.eventType)) {
    reminder.titleMessageError = 'Invalid event type selected.';
    return;
  }
  // Folder must exist
  // Checks if folder id (temporary folder) matches any existing folder ids in folders array
  if (reminder.temporaryFolderID == null || !folders.value.some(folder => String(folder.folderID) === String(reminder.temporaryFolderID))) {
    reminder.folderMessageError = 'Reminder must be in a existing folder.';
    return;
  }

  // If reminder is recurring, save it separately and return
  const recurringReminder = await saveRecurringReminder(reminder);
  // If saveRecurringReminder returned true, the save was successful
  if (recurringReminder) {
    return;
  }

  // Reminder is generated, create/update an override on save
  if (reminder.isGenerated) {
    await saveGeneratedReminder(reminder);
    return;
  }

  // If recurring reminder returned false by failing validation, stop
   if (!recurringReminder && reminder.timeMessageError) {
   return;
 }

  // Continue with normal reminder saving
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

  // Create base reminder in local DB and retrieve the itemID assigned to it
  const itemID = await createReminder(reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEnd, notificationTimestampToSend, hasNotification, reminder.temporaryTitle, extensionsToSend);

  // Fetch the newly created reminder from the DB 
  const row = await readReminder(itemID);
  
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
    // If the saved reminder belongs to an existing recurring series (switching from recurring to normal and saving)
    // Convert series into a normal reminder with its UI fields and delete the series
    // itemID wont be found/match as recurring is in a different table schema, so need to look at original recurrence type to find which table the series is in
      const originalRecurrenceType = reminder.originalRecurrenceType ?? reminder.recurrence?.type ?? null;
      let tableID: number | null = null;
      if (originalRecurrenceType === 'daily') {
        tableID = 21;
      } 
      else if (originalRecurrenceType === 'weekly') {
        tableID = 22;
      } 
      else if (originalRecurrenceType === 'monthly') {
        tableID = 23;
      } 
      else if (originalRecurrenceType === 'yearly') {
        tableID = 24;
      }
      if (reminder.isSaved && !reminder.isRecurring && tableID != null) {
        // Create the new normal reminder
          const itemID = await createReminder(reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEnd, notificationTimestampToSend, hasNotification, reminder.temporaryTitle, extensionsToSend);
          // Delete the recurring series (also deletes generated reminders)
          await deleteItem(reminder.itemID, tableID);
          // Remove old series reminder from UI, keep all other entries
          reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
          // Fetch the newly created reminder from the DB 
          const row = await readReminder(itemID);
  
          // Map DB row into UI and update reminders.value array
          if (row) {
            mapDBToUIReminder(row, true);
          }

      folders.value = mapDBToUIFolder(await readAllFolders());
      await loadRemindersForCalendarDate(selectedDate.value);   

      // Reload calendar month to include newly added reminder
      await loadRemindersForMonth(selectedDate.value);

      // Reload generated reminders since old series was deleted
      await loadGeneratedReminders(selectedDate.value);
    }
      // Reminder is a normal reminder, just update it in DB
      await updateReminder(reminder.itemID, reminder.temporaryFolderID, reminder.eventType, eventStartTime, eventEnd, notificationTimestampToSend, hasNotification, reminder.temporaryTitle, extensionsToSend);

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

// Function to create or update an override when generated reminder is saved
async function saveGeneratedReminder(generatedReminder: UIReminder) {
  try {
    // Not a generated reminder
    if (!generatedReminder || !generatedReminder.isGenerated || !generatedReminder.linkedParentSeriesID
    ) {
      return;
    }

    const originalStartTimestamp = generatedReminder.originalGeneratedTimestamp;
    if (!originalStartTimestamp) {
      return;
    }

    // Create newly edited generated fields from UI fields (event start/end time, notifTime, and hasNotif)
    // Keep time on same day as the generated reminder date
    const eventStartTime = convertTimeAndDateToTimestamp(generatedReminder.date, generatedReminder.temporaryEventStartTime ?? '00:00');
    const eventEndTime = convertTimeAndDateToTimestamp(generatedReminder.date, generatedReminder.temporaryEventEndTime ?? '00:00');

    // Use notification offset
    const notifOffsetMin = generatedReminder.temporaryNotificationTime;
    const hasNotif = notifOffsetMin != null;
    const notifTimestamp = hasNotif
      ? convertNotificationTimestamp(generatedReminder.date, generatedReminder.temporaryEventStartTime ?? '00:00', Number(generatedReminder.temporaryNotificationTime))
      : eventStartTime; // Placeholder if no notification

    // Create override
    await createOrUpdateOverride(generatedReminder.linkedParentSeriesID, originalStartTimestamp, eventStartTime, eventEndTime, notifTimestamp, hasNotif);
    // Reload generated reminders to show updated fields
    await loadGeneratedReminders(selectedDate.value);

  } catch (error) {
    console.error('Error saving generated reminder override:', error);
  }
}

// Function to delete selected individual checkbox reminders
async function deleteReminder(reminder: UIReminder) {
  try {
    // Checkbox deleting a draft removes it from UI and refreshes view
    if (!reminder.isSaved) {  
      // Remove draft reminder from UI
      reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
      return;
    }
    // Delete specific reminder from local DB
    await deleteItem(reminder.itemID, 12);
    // Remove old reminder from UI, keep all other entries
    reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
    // Refresh folders for tree to remove deleted reminder
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Reload reminders for calendar date after deleted reminder
    await loadRemindersForCalendarDate(selectedDate.value);
    // Reload calendar month to include updated reminder
    await loadRemindersForMonth(selectedDate.value);

  } catch (error) {
    console.error('Error deleting reminder from DB:', error);
  }
}

// Function to delete selected recurring reminders
async function deleteRecurringReminderSeries(reminder: UIReminder) {
  try {
    // Checkbox deleting a draft removes it from UI and refreshes view
    if (!reminder.isSaved) {  
      // Remove draft reminder from UI, keep all other entries
      reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
      return;
    }

    // Validate that the reminder is recurring
    if (!reminder.recurrence || !reminder.isRecurring) {
      console.error('Reminder is not recurring:', reminder.itemID);
      return;
    }

    // Delete recurring series using its types table number
    // Deleting a series automatically deletes all its generated reminders 
    if (reminder.recurrence.type === 'daily') {
     await deleteItem(reminder.itemID, 21);
     // Reload generated reminders after new series deletion to immediately show items gone
     await loadGeneratedReminders(selectedDate.value);
   } else if (reminder.recurrence.type === 'weekly') {
     await deleteItem(reminder.itemID, 22);
     await loadGeneratedReminders(selectedDate.value);
   } else if (reminder.recurrence.type === 'monthly') {
     await deleteItem(reminder.itemID, 23);
     await loadGeneratedReminders(selectedDate.value);
   } else if (reminder.recurrence.type === 'yearly') {
     await deleteItem(reminder.itemID, 24);
     await loadGeneratedReminders(selectedDate.value);
   } else {
    // Not a valid recurrence type
     return;
   }
    // Update reminders array to filter out deleted reminder
    // Array only contains reminders where the itemID does not match the deleted reminder's itemID
    reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
   // Successful deletion, refresh file explorer
   folders.value = mapDBToUIFolder(await readAllFolders());
  } catch (error) {
    console.error('Error deleting recurring reminder series from DB:', error);
  }
} 


// Function to delete selected individual checkbox notes
async function deleteNote(note: UINote) {
  try {
    // Checkbox deleting a draft removes it from UI and refreshes view
    if (!note.isSaved) {  
      // Remove draft note from UI, keep all other entries
      notes.value = notes.value.filter(r => String(r.itemID) !== String(note.itemID));
      return;
    }
    // Delete specific note from local DB
    await deleteItem(note.itemID, 11);
    // Update notes array to filter out deleted note
    // Array only contains notes where the itemID does not match the deleted note's itemID
    notes.value = notes.value.filter(n => n.itemID !== note.itemID);
    // Refresh folders for tree to remove deleted note
    folders.value = mapDBToUIFolder(await readAllFolders());
    // Re-load notes after deleted note
    await loadNotes();
  } catch (error) {
    console.error('Error deleting note from DB:', error);
  }
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

    // Check for a draft folder (negative folder ID) 
    // Look for folder from folders array thats ID matches the negative selected node
    const folderDraft = folders.value.find(folder => String(folder.folderID) === String(selectedNode));
    if (folderDraft) {
      try {
        // Folder never been saved before (draft), remove from file explorer list
        if (!folderDraft.isSaved) {
          folders.value = folders.value.filter(f => String(f.folderID) !== String(folderDraft.folderID))
        }

      } catch (error) {
        console.error('Error deleting draft folder:', error);
      }
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
        if (reminderToDelete.isRecurring) {
          // If reminder is recurring, delete series and reload generated
          await deleteRecurringReminderSeries(reminderToDelete);
          // Clear tree node selection after deletion
          selectedFolderID.value = null;
          return;
        }
        else {
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
        }
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

// Adds a new reminder draft from the file explorer add button
function addExplorerReminder() {
  tab.value = 'reminders';
  addReminder();
}

// Adds a new note draft from the file explorer add button
function addExplorerNote() {
  tab.value = 'notes';
  addNote();
}

// Toggles behavior of delete button. If on reminder tab, delete selected reminders from array. If on notes tab, delete selected notes from array.
async function deleteArrayItem() {
  if (tab.value === 'reminders') {
    // Delete all selected reminders by calling deleteReminder for each selected item
    const selectedReminders = reminders.value.filter(reminder => reminder.isSelected);
    // Call appropriate delete function dependent on if reminder is recurring or not
    for (const reminder of selectedReminders) {
      if (reminder.isRecurring) {
        await deleteRecurringReminderSeries(reminder);
      } else {
        await deleteReminder(reminder);
      }
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
  // No generated support for canceling (no function exists to read a single generated by ID because they share itemID with the parent series)
  if (reminder && reminder.isGenerated) {
    return;
  }
  // Reminder is a draft, remove from list
  if (!reminder.isSaved) {
    reminders.value = reminders.value.filter(r => String(r.itemID) !== String(reminder.itemID));
    return;
  // Reminder is saved, revert temporary fields back to saved database values
  } else {
      // Reminder is recurring, cancel its fields back to saved DB state
      const originalRecurrenceType = reminder.originalRecurrenceType ?? reminder.recurrence?.type ?? null;
      // Recurring reminder is daily, read from daily table and map to UI
      if (reminder.isRecurring) {
        if (originalRecurrenceType === 'daily') {
         const row = await readDailyReminder(reminder.itemID);
         if (row) {
          mapDBSeriesToUIRecurringReminder(row, 'daily', true);
        } 
      }
      else if (originalRecurrenceType === 'weekly') {
        const row = await readWeeklyReminder(reminder.itemID);
        if (row) {
          mapDBSeriesToUIRecurringReminder(row, 'weekly', true)
        }
      } else if (originalRecurrenceType === 'monthly') {
        const row = await readMonthlyReminder(reminder.itemID);
        if (row) {
          mapDBSeriesToUIRecurringReminder(row, 'monthly', true)
        }
      }
      else if (originalRecurrenceType === 'yearly') {
        const row = await readYearlyReminder(reminder.itemID);
        if (row) {
          mapDBSeriesToUIRecurringReminder(row, 'yearly', true)
        }
      }
    } 
      // Normal reminder, read from its table and map to UI
      else {
        const row = await readReminder(reminder.itemID);
        if (row) {
          mapDBToUIReminder(row, true);
      } 
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

// Calendar functionality and watchers
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

// Reload list of reminders whenever the selected calendar date changes
watch(selectedDate, async (newDate) => {
  // Load reminders for newly selected calendar date
  await loadRemindersForCalendarDate(newDate);
  await loadRemindersForMonth(newDate);
  await loadGeneratedReminders(newDate);
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

// Account variables/functions
const serverAddress = ref<string>('');
const newUsername = ref<string>('');
const newPassword = ref<string>('');
const isPwd = ref(true);
const $q = useQuasar();
const router = useRouter();

async function logout()
{
  try {
    await window.syncAPI.sync();
    const isDeleted: boolean = await window.electronAuthAPI.clearLocalData();
    if(isDeleted){
            $q.notify({
            type: 'positive',
            message: 'Successfully logged out'
            });
            //close popup of Login options (i.e. change login and logout)
            showLoginOptions.value = false;
            isLoggedIn.value = false;
            console.log('LOGUOUT FUNCTION', isLoggedIn.value);
            await router.push('/login');
        } 
    } catch (error) {
      console.error('Logout failed:', error);
    }
}

async function checkLoggedIn()
{
  try{
    isLoggedIn.value = await window.electronAuthAPI.isUserLoggedIn();
    console.log('checkLoggedIn FUNCTION', isLoggedIn.value);
    if (isLoggedIn.value) {
      showLoginOptions.value = true;
    } else {
      await router.push('/register');
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

async function saveServerAddress() {
  await window.syncAPI.setServerAddress(serverAddress.value);
  $q.notify({
    type: 'positive',
    message: "Server Address changed successfully."
  });
}

async function saveLoginChanges() {
  try {
    const isLoginChanged = await window.electronAuthAPI.changeLogin(newUsername.value, newPassword.value);
    if (isLoginChanged) {
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
  // Parse the hex string to an integer
  return Number.parseInt(hexColor, 16);
} 

const colorHex = ref<string>('#459DD8'); // Default folder color hex value

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


const presetColors: string[] = [  '#D1495B', '#FF90B3','#F18805', 
                      '#F0A202', '#FFE066', '#103900',
                      '#9AC19A', '#459DD8','#C69DD2',
                      '#4814BD'];

async function updatePresetColor(){
  //go through all folders
  folders.value.forEach((folder, index) => {
    const folderColor = convertInttoHex(folder.colorCode).toUpperCase();
     //add recently chosen color to preset list
    const isColorFound = presetColors.includes(folderColor);
    if (!isColorFound){
      presetColors.push(folderColor); 
    }
  });

}

</script>