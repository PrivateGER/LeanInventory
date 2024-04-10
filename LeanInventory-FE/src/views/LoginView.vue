<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <span class="headline">Login to LeanInventory</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-text-field
                  label="Username"
                  v-model="username"
                  :rules="usernameRules"
                  required
                  outlined
              ></v-text-field>
              <v-text-field
                  label="Password"
                  type="password"
                  v-model="password"
                  :rules="passwordRules"
                  required
                  outlined
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="login" :disabled="!valid" color="primary">Login</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

import Swal from 'sweetalert2'
import router from "@/router";
import {useGlobalStore} from "@/stores/global-store";

const valid = ref(true);
const username = ref('');
const password = ref('');
const selectedTenant = ref("Loading...");
const tenants = ref(["Loading..."]);

const store = useGlobalStore();

const usernameRules = [v => !!v || 'Username is required'];
const passwordRules = [v => !!v || 'Password is required'];

import { gql } from 'graphql-tag';

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    login();
  }
});

const login = async () => {
  if (valid.value) {
    let response = await window.apolloClient.mutate({
      mutation: gql`
        mutation Login($username: String!, $password: String!) {
          login(credentials: {username: $username, password: $password}) {
            accessToken
          }
        }
      `,
      variables: {
        username: username.value,
        password: password.value,
      }
    })

    if (response.errors) {
      await Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Invalid username or password!',
      })
      return
    }

    let token = response.data.login.accessToken;

    store.changeLoginState(token, username, true)

    await router.push({name: 'dashboard'})
  }
};
</script>
