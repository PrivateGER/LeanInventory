<script setup>
</script>

<template>
  <!-- Main Content -->
  <v-main>
    <v-container>
      <v-row class="text-center">
        <v-col>
          <v-img src="/logofullsize.svg" max-width="500" class="mx-auto"></v-img>

          <h1>Welcome to LeanInventory</h1>
          <p>Your modern solution for inventory management.</p>
          <br />
          <router-link to="/login">
            <v-btn color="primary" large>Log in</v-btn>
          </router-link>
        </v-col>
      </v-row>
    </v-container>
  </v-main>

  <!-- Footer -->
  <v-footer color="indigo" app>
    <v-col class="text-center" cols="12">
      ©2023 LeanInventory
    </v-col>
  </v-footer>
</template>
