<script setup>
import {computed, ref} from "vue";
import {gql} from "graphql-tag";
import Swal from "sweetalert2";
import {useGlobalStore} from "@/stores/global-store";
const store = useGlobalStore();

const props = defineProps({
  itemid: {
    type: String,
    required: false
  }
});
const orders = ref([]);
const loading = ref(false);

const fetchOrders = async () => {
  loading.value = true;
  let response;
  if (props.itemid != null) {
    response = await window.apolloClient.query({
      query: gql`
        query GetOrders($itemid: uuid!) {
          orders(where: {item_id: {_eq: $itemid}}, order_by: {created_at: asc}) {
            id
            item {
              id
              name
              description
              price
              stock_available
            }
            count
            total_cost
            order_state
            created_at
          }
        }
      `,
      variables: {
        itemid: props.itemid
      },
      context: store.graphqlContext,
      fetchPolicy: 'no-cache'
    });
  } else {
    response = await window.apolloClient.query({
      query: gql`
        query GetOrders {
          orders(order_by: {created_at: asc}) {
            id
            item {
              id
              name
              description
              price
              stock_available
            }
            count
            total_cost
            order_state
            created_at
          }
        }
      `,
      context: store.graphqlContext,
      fetchPolicy: 'no-cache'
    });
  }

  orders.value = response.data.orders;
  loading.value = false;
};

const cancelOrder = async (orderid) => {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will cancel the order.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await window.apolloClient.mutate({
        mutation: gql`
          mutation CancelOrder($orderid: uuid!) {
            update_orders_by_pk(pk_columns: {id: $orderid}, _set: {order_state: CANCELLED}) {
              id
            }
          }
        `,
        variables: {
          orderid: orderid,
        },
        context: store.graphqlContext
      });

      await fetchOrders();
    }
  });
};

const receiveOrder = async (orderid) => {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will mark the order as received and the available stock will be updated.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No'
  }).then(async (result) => {
    if (result.isConfirmed) {
      let updatedItem = await window.apolloClient.query({
        query: gql`
          query GetItem($itemid: uuid!) {
            items_by_pk(id: $itemid) {
              id
              stock_available
            }
          }
        `,
        variables: {
          itemid: orders.value.find(order => order.id === orderid).item.id
        },
        context: store.graphqlContext,
        fetchPolicy: 'no-cache'
      });

      let stock_available = updatedItem.data.items_by_pk.stock_available + orders.value.find(order => order.id === orderid).count;

      await window.apolloClient.mutate({
        mutation: gql`
          mutation ReceiveOrder($orderid: uuid!, $itemid: uuid!, $stock_available: Int!) {
            update_orders_by_pk(pk_columns: {id: $orderid}, _set: {order_state: RECEIVED}) {
              id
            }

            update_items_by_pk(pk_columns: {id: $itemid}, _set: {stock_available: $stock_available}) {
              id
            }
          }
        `,
        variables: {
          orderid: orderid,
          itemid: updatedItem.data.items_by_pk.id,
          stock_available: stock_available
        },
        context: store.graphqlContext
      });

      await fetchOrders();
    }
  });


};

const orderCost = (orderid) => {
  let order = orders.value.find(order => order.id === orderid);
  return order.total_cost ? (order.total_cost / 100).toFixed(2) + ' €' : ((order.item.price * order.count) / 100).toFixed(2) + ' €';
};

const orderStateColor = (orderid) => {
  let order = orders.value.find(order => order.id === orderid);
  switch (order.order_state) {
    case 'CREATED':
      return 'primary';
    case 'RECEIVED':
      return 'success';
    case 'SHIPPED':
      return 'yellow';
    case 'CANCELLED':
      return 'error';
  }
};

const reversedOrders = computed(() => {
  return orders.value.slice().reverse();
});

const orderDate = (orderid) => {
  let order = orders.value.find(order => order.id === orderid);
  return new Date(order.created_at).toLocaleString();
};

fetchOrders();
</script>

<template>
  <v-btn @click="fetchOrders" color="primary">Refresh</v-btn>
  <v-timeline side="start" v-if="!loading">
    <v-timeline-item  v-for="order in reversedOrders" :key="order.id" size="small" :dot-color="orderStateColor(order.id)">
      <template #opposite>
        <v-card>
          <v-card-title>{{ order.count }}x {{ order.item.name }}</v-card-title>
          <v-card-text>
            <p>{{ order.item.description }}</p>
            <p>Price: {{ orderCost(order.id) }}</p>
            <p>State: {{ order.order_state }}</p>
            <p>Created: {{ orderDate(order.id) }}</p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="receiveOrder(order.id)" v-if="order.order_state === 'CREATED'">Receive</v-btn>
            <v-btn color="red" @click="cancelOrder(order.id)" v-if="order.order_state === 'CREATED'">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-timeline-item>
  </v-timeline>
  <v-skeleton-loader v-else type="table"></v-skeleton-loader>
</template>

<style scoped>

</style>