<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-flex d-sm-none"></v-app-bar-nav-icon>
      <v-toolbar-title>
        LeanInventory
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <RouterLink
          v-for="item in visibleLinks"
          :key="item.title"
          :to="item.link"
          v-slot="{ href, navigate, route }"
          custom
      >
        <v-btn @click="navigate">{{ item.title }}</v-btn>
      </RouterLink>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app>
      <v-list>
            <v-list-item v-for="item in visibleLinks">
                <RouterLink
                    :key="item.title"
                    :to="item.link"
                >
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </RouterLink>
            </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="pa-4 mt-16">
      <RouterView />
    </v-main>
  </v-app>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import {useGlobalStore} from "@/stores/global-store";
import router from "@/router";
import {storeToRefs} from "pinia";

const store = useGlobalStore();
const {loggedInUser, visibleLinks, drawer} = storeToRefs(store);

/*if(loggedInUser) {
  // Check if user is on a non-public page while not logged in
  const currentRoute = router.currentRoute.value.name;
  if (!visibleLinks.value.find(item => item.link === currentRoute)) {
    router.push({name: 'login'});
  }
}*/

</script>

<style scoped>

</style>
