<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field label="Search items..." v-model="search" prepend-inner-icon="mdi-magnify" clearable></v-text-field>
      </v-col>
      <v-col cols="12" sm="6">
        <v-select
            v-model="selectedCategories"
            :items="allCategories"
            label="Select categories"
            multiple
            clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-data-table
        v-if="items.length > 0"
        :headers="headers"
        :items="itemValues"
        item-value="name"
        :items-per-page="10"
        class="elevation-1"
        :search="search"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn color="primary" text @click="editItem(item)">Edit</v-btn>
        <router-link :to="`/item/${item.id}`" class="ml-2">
          <v-btn color="primary" text>View</v-btn>
        </router-link>
      </template>
    </v-data-table>

    <p class="v-card-title" v-else>No items yet!</p>

    <v-divider class="my-4"></v-divider>

    <v-row class="mb-3 mx-auto">
      <v-col :v-if="store.isAdmin">
        <router-link to="/items/create">
          <v-btn prepend-icon="mdi-plus" block color="primary">New Item</v-btn>
        </router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import {useGlobalStore} from "@/stores/global-store";
import {storeToRefs} from "pinia";
import router from "@/router";

const search = ref('');
const selectedCategories = ref([]);

const headers = [
  { title: 'Item Name', key: 'name' },
  { title: 'Price', key: 'price' },
  { title: 'Available', key: 'stock_available' },
  { title: 'Reserved', key: 'stock_reserved' },
  { title: 'Minimum', key: 'stock_minimum' },
  { title: 'Actions', key: 'actions' },
];


const store = useGlobalStore();

// Store items to ref
const { items, allCategories } = storeToRefs(store);

const itemValues = computed(() => {
  return filteredItems.value.map(item => {
    return {
      ...item,
      price: item.price.toFixed(2) + ' €',
    }
  })
})

onMounted(async () => {
  if(store.items.length === 0) {
    await store.refreshItems();
  }
});

const editItem = (item) => {
  console.log("Editing item:", JSON.stringify(item))

  // Redirect to the edit page
  router.push({name: 'items-edit', params: {id: item.id }});
};

const createNewItem = () => {
  // Implement the logic to create a new item
  console.log("Creating new item");
};

const filteredItems = computed(() => {
  console.log(selectedCategories)
  if (selectedCategories.value.length === 0) {
    return items.value;
  }
  return items.value.filter(item =>
      item.categories.some(category => selectedCategories.value.includes(category))
  );
});
</script>

<style scoped>
/* Add any specific styles for this page if needed */
</style>
