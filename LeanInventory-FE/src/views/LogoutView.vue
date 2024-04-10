<script setup>
import {onMounted} from "vue";


// Fetch the /auth/logout endpoint to remove the JWT
onMounted(() => {
  fetch(window.API_BASE_URL + '/auth/logout', {
    method: 'POST',
    headers: {

    }
  }).then(response => {
    if (response.status === 200) {
      localStorage.removeItem('token');
    }
    window.location.href = '/';
  });
  }
);
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <span class="headline">You've been logged out</span>
          </v-card-title>
          <v-card-text>
            <p>Thank you for using LeanInventory. You have been successfully logged out.</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary">
              <a href="/" target="_parent">Back to home page</a>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>

</style>