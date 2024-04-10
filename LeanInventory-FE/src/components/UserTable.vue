<script>
import { useGlobalStore } from '@/stores/global-store';
import {storeToRefs} from "pinia";

const store = useGlobalStore();

export default {
  data() {
    return {
      search: '',
      headers: [
        { title: 'Username', key: 'username' },
        { title: 'Actions', key: 'actions' },
      ],
    };
  },
  mounted() {
    this.fetchUsernames();
  },
  computed: {
    users: () => {
      console.log(store.userTable)
      return store.userTable
    },
  },
  methods: {
    async fetchUsernames() {
      await store.fetchUsers();
    },
  },
};
</script>

<template>
  <v-text-field
      v-model="search"
      label="Search users..."
      prepend-inner-icon="mdi-magnify"
      clearable></v-text-field>
  <v-data-table
      :headers="headers"
      :items="users"
      :items-per-page="25"
      :search="search"
      class="elevation-1"
  >
    <template v-slot:item.actions="{ item }">
      <RouterLink :to="{ name: 'view-user', params: {name: item.username} }">
        <v-btn color="primary">View Inventory</v-btn>
      </RouterLink>
    </template>
  </v-data-table>
</template>

