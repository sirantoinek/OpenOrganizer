<!--
 * Authors: Rachel Patella, Maria Pasaylo
 * Created: 2025-09-22
 * Updated: 2025-11-28
 *
 * This file is the login form for users to log in to a preexisting account that includes a sidebar with the application name and logo
 *
 * References:
 * https://quasar.dev/vue-components/input#Example--Input-types for password visibility toggle
 * 
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and 
 * license terms outlined in the LICENSE file located in the top-level directory of 
 * this distribution. No part of OpenOrganizer, including this file, may be reproduced, 
 * modified, distributed, or otherwise used except in accordance with the terms 
 * specified in the LICENSE file.
-->

<template>
    <div class="login-registration-container"> 
        <div class="login-register-sidebar">
            <h1 style="text-align: center; font-size: 50px; margin-top: -5px;">Welcome to<br>OpenOrganizer!</h1>
            <q-icon style="font-size: 150px; margin-top: 50px;" name="event" />
        </div>
        <div class="login-registration-form">
            <h1 style="text-align: center; font-size: 50px; margin-top: 30px; color: black; font-weight: bold; max-width: 400px;">Login</h1>
            <p style="font-size: 17px">Don't have an account yet? Sign up
                <router-link to="/register">here</router-link>
            </p>
            <q-input class="username-password-box" v-model="username" square filled placeholder="Username"></q-input>
            <q-input class="username-password-box" v-model="password" filled :type="isPwd ? 'password' : 'text'" placeholder="Password">
                <template v-slot:append>
                <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"/>
                </template>
            </q-input>
            <q-btn class="login-register-button" 
            style="font-size: 15px" 
            @click= login
            :loading="isLoading"
            :disable="isLoading"
            no-caps 
            label="Login"/>
            <q-btn class="login-register-button" 
            style="font-size: 15px"
            @click= "router.push('/calendar')" no-caps
            label="Home Page"/>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';


const router = useRouter();
const $q = useQuasar();
const username = ref<string>('');
const password = ref<string>('');
const isPwd = ref(true);
const isLoading = ref(false);

async function login() {
     if (!username.value || !password.value){
        $q.notify({
            type: 'negative',
            message: 'Please fill in both username and password fields.'
        });
        return
    }

    isLoading.value = true;

    try {
        const result = await window.electronAuthAPI.loginAccount(username.value, password.value);
        if(result){
            $q.notify({
                type: 'positive',
                message: 'You are now logged in!'
            })
            //navigate to main calendar page
            await router.push('/calendar');
        } 
    } catch (error) {
        console.error('Error logging into account', error);
        $q.notify({
            type: 'negative',
            message: 'An error occured while creating account'
        });
    } finally {
        isLoading.value = false;
    }
}
</script>