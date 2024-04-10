<script setup>
import router from "@/router";
import {useGlobalStore} from "@/stores/global-store";
import {computed, onMounted} from "vue";

const store = useGlobalStore();
const userName = computed(() => store.userName);
const admin = computed(() => store.admin);

onMounted(async () => {
  if (!store.loggedIn) {
    await router.push({name: 'login'})
  }
});

</script>

<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="pa-5" elevation="4">
          <v-card-title class="headline">{{ userName }}</v-card-title>
          <v-card-subtitle>Welcome back!</v-card-subtitle>
          <v-card-text class="mt-3">
            <v-icon color="primary" class="mr-2">mdi-shield-star</v-icon>
            You have admin privileges.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>


  <v-container :v-if="admin">
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="pa-5" elevation="4">
          <v-card-title class="headline">Administrative actions</v-card-title>
          <v-card-item class="pa-4">
            <router-link to="/items">
              <v-btn class="mr-4 mt-4" color="primary" prepend-icon="mdi-format-list-bulleted">Manage Items</v-btn>
            </router-link>
            <router-link to="/users">
              <v-btn class="mr-4 mt-4" color="primary" prepend-icon="mdi-account-multiple">Manage Users</v-btn>
            </router-link>
            <router-link to="/orders">
              <v-btn class="mr-4 mt-4"  color="primary" prepend-icon="mdi-cart-outline">Manage Orders</v-btn>
            </router-link>
            <router-link to="/reports">
              <v-btn class="mr-4 mt-4" color="primary" prepend-icon="mdi-clipboard-text">Reports</v-btn>
            </router-link>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>


</template>

<style scoped>

</style>