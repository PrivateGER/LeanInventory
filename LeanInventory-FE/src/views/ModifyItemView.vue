<script setup>
import { ref } from 'vue';
import {useGlobalStore} from "@/stores/global-store";
import {useRoute} from "vue-router";
import router from "@/router";
import Swal from "sweetalert2";
import {storeToRefs} from "pinia";
import { gql } from 'graphql-tag';

const route = useRoute();
const isEditMode = route.name === 'items-edit';
const itemID = isEditMode ? route.params.id : -1;

const item = ref({ name: '', description: '', price: 0, stock_minimum: 0, stock_reserved: 0, stock_available: 0, categories: [] });
const locations = ref([]); // Initialize with one empty string for the first location input
const categories = ref([]);

// If in edit mode, fetch the item from the API
const store = useGlobalStore();
store.refreshItems();

if (isEditMode) {
  const itemToEdit = JSON.parse(JSON.stringify(store.items.find(item => item.id === itemID)));
  if (itemToEdit) {
    item.value = itemToEdit;
    locations.value = itemToEdit.purchase_locations;
    item.price = item.price / 100;
    item.categories = itemToEdit.categories;
    categories.value = itemToEdit.categories;
  }
}
const { allCategories } = storeToRefs(store);

const textareaRules = [
  v => v.length <= 255 || 'Max 255 characters',
];
const priceRules = [
  v => !!v || 'Price is required',
  v => v >= 0 || 'Price must be greater than 0',
  v => /^\d+(\.\d{1,2})?$/.test(v) || 'Price must be a number',
];
const locationRules = [
  v => !!v || 'Location is required',
  v => v.startsWith('http') || 'Location must be a valid URL',
]
const stockRules = [
  v => v >= 0 || 'Stock must be greater than 0',
  // Needs to be a number
  v => /^\d+$/.test(v) || 'Stock must be a number',
];

const addLocation = () => {
  locations.value.push('');
};

const removeLocation = (index) => {
  locations.value.splice(index, 1);
};

const submitForm = async () => {
  try {
    let response;
    if (isEditMode) {
      response = await window.apolloClient.mutate({
        mutation: gql`
            mutation UpdateItem($id: uuid!, $name: String!, $description: String!, $price: Int!, $stock_minimum: Int!, $stock_reserved: Int!, $stock_available: Int!, $categories: [String!]!, $purchase_locations: jsonb) {
              update_items_by_pk(pk_columns: {id: $id}, _set: {name: $name, description: $description, price: $price, stock_minimum: $stock_minimum, stock_reserved: $stock_reserved, stock_available: $stock_available, categories: $categories, purchase_locations: $purchase_locations}) {
                id
              }
            }
        `, variables: {
          id: itemID,
          name: item.value.name,
          description: item.value.description,
          price: item.value.price * 100,
          stock_minimum: item.value.stock_minimum,
          stock_reserved: item.value.stock_reserved,
          stock_available: item.value.stock_available,
          categories: categories.value,
          purchase_locations: locations.value
        },
        context: store.graphqlContext
      })
    } else {
      response = await window.apolloClient.mutate({
        mutation: gql`
            mutation CreateItem($name: String!, $description: String!, $price: Int!, $stock_minimum: Int!, $stock_reserved: Int!, $stock_available: Int!, $categories: [String!]!, $purchase_locations: jsonb) {
              insert_items_one(object: {name: $name, description: $description, price: $price, stock_minimum: $stock_minimum, stock_reserved: $stock_reserved, stock_available: $stock_available, categories: $categories, purchase_locations: $purchase_locations}) {
                id
              }
            }
        `, variables: {
          name: item.value.name,
          description: item.value.description,
          price: item.value.price * 100,
          stock_minimum: item.value.stock_minimum,
          stock_reserved: item.value.stock_reserved,
          stock_available: item.value.stock_available,
          categories: categories.value,
          purchase_locations: locations.value
        },
        context: store.graphqlContext
      })
    }

    await store.refreshItems();
    await router.push({name: 'items'});
  } catch (error) {
    console.error('Error adding item:', error);

    await Swal.fire({
      title: 'Error',
      text: 'Failed to add item: ' + error.message,
      icon: 'error',
      confirmButtonText: 'OK'
    })
  }
};
</script>


<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="12">
        <v-card>
          <v-card-title v-if="!isEditMode">Create new item</v-card-title>
          <v-card-title v-else>Edit item</v-card-title>

          <v-card-text>
            <v-form @submit.prevent="submitForm">
              <v-text-field prepend-icon="mdi-rename" v-model="item.name" label="Item Name" required autofocus></v-text-field>
              <v-textarea prepend-icon="mdi-image-text" v-model="item.description" label="Description" auto-grow clearable counter :rules="textareaRules"></v-textarea>
              <v-text-field prepend-icon="mdi-currency-eur" v-model="item.price" label="Price" type="number" :rules="priceRules" hint="Make sure to use decimal points, not commas." required></v-text-field>

              <v-divider class="my-4"></v-divider>
              <p class="v-card-title">Shopping locations</p>

              <!-- Shopping Locations -->
              <v-row v-for="(location, index) in locations" :key="index">
                <v-col cols="10">
                  <v-text-field v-model="locations[index]" label="Purchase URL" hint="Direct links only" :rules="locationRules"></v-text-field>
                </v-col>
                <v-col cols="2">
                  <v-btn icon @click="removeLocation(index)">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
              <v-btn prepend-icon="mdi-plus" color="primary" @click="addLocation">Add location</v-btn>

              <v-divider class="my-4"></v-divider>
              <p class="v-card-title">Categories</p>

              <!-- Categories -->
              <v-combobox
                  v-model="categories"
                  :items="allCategories"
                  label="Categories"
                  multiple
                  chips
                  clearable
              ></v-combobox>


              <v-divider class="my-4"></v-divider>

              <p class="v-card-title">Stock settings</p>

              <v-text-field prepend-icon="mdi-package-variant-closed" :rules="stockRules" v-model="item.stock_minimum" label="Minimum stock needed" type="number" hint="Trigger warning when falling below this number"></v-text-field>
              <v-text-field prepend-icon="mdi-package-variant-closed" :rules="stockRules" v-model="item.stock_reserved" label="Reserved stock" type="number" hint="Reserved items aren't listed as available"></v-text-field>
              <v-text-field prepend-icon="mdi-package-variant-closed" :rules="stockRules" v-model="item.stock_available" label="Available stock" type="number"></v-text-field>

              <v-divider class="my-4"></v-divider>

              <v-btn type="submit" block color="primary">{{ isEditMode ? "Save changes" : "Add Item" }}</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

