<script setup>
import {useGlobalStore} from "@/stores/global-store";
import router from "@/router";
import {computed, ref} from "vue";
import Swal from "sweetalert2";
import {RouterLink} from "vue-router";
import {gql} from "graphql-tag";

const store = useGlobalStore();
const ownedItems = ref([]);

// get the user id from the route
const userID = router.currentRoute.value.params.name;
const loaded = ref(false);

const user = ref({
  username: 'Loading...'
})

store.refreshItems();
store.fetchDeepUserMetadata(userID).then(() => {
  let user_obj = store.users.find(user => user.username === userID);
  user.value = user_obj;
  ownedItems.value = user_obj.owned_items;
  console.log(user.value);
  loaded.value = true;
});

const ownedItemsTable = computed(() => {
  let items = [];
  for (const item of ownedItems.value) {
    console.log(item);
    let storeItem = store.items.find(storeItem => storeItem.id === item.item.id);
    if (storeItem) {
      items.push({
        name: storeItem.name,
        price: storeItem.price,
        id: storeItem.id,
        quantity: item.quantity,
      })
    }
  }
  return items;
});

const tableHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Price', key: 'price' },
  { title: 'Quantity', key: 'quantity' },
  { title: 'Actions', key: 'actions', sortable: false },
];


</script>

<template>
  <v-card v-if="loaded">
    <v-card-title>
      {{ user.username }}'s Inventory
    </v-card-title>
    <v-card-subtitle>
      View all items owned by {{ user.username }}.
    </v-card-subtitle>
    <v-card-text>
      <v-data-table
        :headers="tableHeaders"
        :items="ownedItemsTable"
        :items-per-page="10"
        class="elevation-1"
      >
        <template v-slot:item.actions="{ item }">
          <RouterLink :to="{ name: 'item', params: {id: item.id} }" v-slot="{ href, navigate, route }" custom>
            <v-btn @click="navigate" variant="text">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </RouterLink>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>

</style>