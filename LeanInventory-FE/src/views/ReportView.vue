<script setup>
import {useGlobalStore} from "@/stores/global-store";
import {computed, ref} from "vue";
import {gql} from "graphql-tag";

const store = useGlobalStore();

const items = ref([]);

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
          purchase_locations
          orders {
            id
            order_state
            count
          }
        }
      }
    `,
    context: store.graphqlContext,
  });

  items.value = response.data.items;
};

const missingItems = computed(() => {
  return items.value.filter(item => ((item.stock_available - item.stock_reserved) < item.stock_minimum));
});
const missingItemsTable = computed(() => {
  return missingItems.value.map(item => {
    return {
      name: item.name,
      stock_available: item.stock_available,
      stock_minimum: item.stock_minimum,
      active_orders: item.orders.filter(order => order.order_state === 'ORDERED').length
    }
  });
});
let missingItemHeaders = [
  {title: 'Name', key: 'name'},
  {title: 'Available now', key: 'stock_available'},
  {title: 'Stock minimum', key: 'stock_minimum'},
  {title: 'Active orders', key: 'active_orders'},
];

const activeOrders = computed(() => {
  return items.value.filter(item => item.orders.filter(order => order.order_state === 'CREATED').length > 0);
});
const activeOrdersTable = computed(() => {
  return activeOrders.value.map(item => {
    return {
      name: item.name,
      active_orders: item.orders.filter(order => order.order_state === 'CREATED').length,
      stock_in_orders: item.orders.filter(order => order.order_state === 'CREATED').reduce((acc, order) => acc + order.count, 0)
    }
  });
});
let activeOrdersHeaders = [
  {title: 'Name', key: 'name'},
  {title: 'Stock in active orders', key: 'stock_in_orders'},
  {title: 'Active orders', key: 'active_orders'},
];

fetchItems();
</script>

<template>
  <div>
    <v-card>
      <v-card-title>
        Report overview
      </v-card-title>
    </v-card>

    <v-card class="mt-4">
      <v-card-title>
        Report: Missing items
      </v-card-title>
      <v-data-table
        :headers="missingItemHeaders"
        :items="missingItemsTable"
        v-if="missingItemsTable.length > 0"
      >
      </v-data-table>
      <p class="v-card-title" v-else>No missing items</p>
    </v-card>

    <v-card class="mt-4">
      <v-card-title>
        Report: Active Orders
      </v-card-title>
      <v-data-table
        :headers="activeOrdersHeaders"
        :items="activeOrdersTable"
        v-if="activeOrdersTable.length > 0"
      >
      </v-data-table>
      <p class="v-card-title" v-else>No active orders</p>
    </v-card>
  </div>
</template>

<style scoped>

</style>