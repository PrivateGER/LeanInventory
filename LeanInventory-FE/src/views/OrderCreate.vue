<script setup>
import {useGlobalStore} from "@/stores/global-store";
import {computed, ref} from "vue";
import {gql} from "graphql-tag";
import {useRoute} from "vue-router";

import router from "@/router";

const store = useGlobalStore();
const items = ref([]);
const selectedItem = ref(null);
const count = ref(null);
const totalCost = ref(null);

const fetchItems = async () => {
  const response = await window.apolloClient.query({
    query: gql`
      query GetItems {
        items {
          id
          name
          price
          stock_available
          stock_reserved
          stock_minimum
        }
      }
    `,
    context: store.graphqlContext,
  });

  items.value = response.data.items;
};

const convertUserNumber = (number) => {
  return Math.round(parseFloat(number).toFixed(2) * 100);
};

const createOrder = async () => {
  let item = items.value.find(item => item.name === selectedItem.value);
  let itemID = item.id;

  // count has to be an integer
  if (!count.value || count.value < 1) {
    alert("Please enter a valid count");
    return;
  }

  let total_cost_calculated = null;
  if (totalCost && totalCost.value !== 0) {
    total_cost_calculated = convertUserNumber(totalCost.value);
  }

  let response = await window.apolloClient.mutate({
    mutation: gql`
      mutation CreateOrder($itemid: uuid!, $count: Int!, $total_cost: Int) {
        insert_orders_one(object: {item_id: $itemid, count: $count, total_cost: $total_cost}) {
          id
        }
      }
    `,
    variables: {
      itemid: itemID,
      count: count.value,
      total_cost: total_cost_calculated || null,
    },
    context: store.graphqlContext,
  });

  await window.apolloClient.reFetchObservableQueries();

  await router.push({name: 'order-list'});
};


fetchItems();

</script>

<template>
  <h1>Create new order</h1>

  <v-container>
    <v-row>
      <v-col cols="12">
        <v-autocomplete
          v-model="selectedItem"
          :items="items.map(item => item.name)"
          label="Select item"
          outlined
        ></v-autocomplete>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">

        <v-text-field
          v-model="count"
          label="Count"
          outlined
          type="number"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="totalCost"
          label="Total cost (optional)"
          outlined
          type="number"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-btn @click="createOrder" color="primary">Create order</v-btn>
      </v-col>
    </v-row>

  </v-container>
</template>

<style scoped>

</style>