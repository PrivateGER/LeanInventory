<script setup>
import {useGlobalStore} from "@/stores/global-store";
import {computed, ref} from "vue";
import {gql} from "graphql-tag";
import Swal from "sweetalert2";
import OrderTimeline from "@/components/OrderTimeline.vue";

const store = useGlobalStore();

</script>


<template>
  <h1>Order Overview</h1>

  <router-link to="/order/create">
    <v-btn color="primary">Create new order</v-btn>
  </router-link>

  <v-divider class="ma-4"></v-divider>

  <h2>Order Timeline</h2>
  <OrderTimeline />
</template>

<style scoped>

</style>
