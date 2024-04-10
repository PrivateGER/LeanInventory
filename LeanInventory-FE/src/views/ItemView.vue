<script setup>
import {useGlobalStore} from "@/stores/global-store";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import AddItemToUser from "@/components/AddItemToUser.vue";
import {gql} from "graphql-tag";
import OrderTimeline from "@/components/OrderTimeline.vue";

const store = useGlobalStore();

const loading = ref(true);

const route = useRoute();
const graphqlItem = ref({

});

const postprocessedShoppingLocations = computed(() => {
  return graphqlItem.value.purchase_locations.map(location => {
    // Parse the URL to get the hostname, e.g. https://www.example.com/path/to/item -> www.example.com
    try {
      const url = new URL(location);
      return {
        url: location,
        hostname: url.hostname
      }
    } catch (error) {
      return {
        url: location,
        hostname: location
      }
    }
  });
});

const updateStock = async (type, amount) => {
  // Modify local state, then sync object with API
  let itemCopy = JSON.parse(JSON.stringify(graphqlItem.value));

  const key = `stock_${type}`;
  if (itemCopy[key] + amount >= 0) {
    itemCopy[key] += amount;

    try {
      await window.apolloClient.mutate({
        mutation: gql`
          mutation UpdateItemStock($id: uuid!, $stock_available: Int!, $stock_reserved: Int!, $stock_minimum: Int!) {
            update_items_by_pk(pk_columns: {id: $id}, _set: {stock_available: $stock_available, stock_reserved: $stock_reserved, stock_minimum: $stock_minimum}) {
              id
            }
          }
        `,
        variables: {
          id: itemCopy.id,
          stock_available: itemCopy.stock_available,
          stock_reserved: itemCopy.stock_reserved,
          stock_minimum: itemCopy.stock_minimum
        },
        context: store.graphqlContext
      });

      await store.refreshItems();

      graphqlItem.value = itemCopy;
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  }
};

const deleteItem = async () => {
  // confirm with sweetalert
  Swal.fire({
    title: 'Are you sure?',
    text: "This will permanently delete the item, including from inventories of users.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        window.apolloClient.mutate({
          mutation: gql`
            mutation DeleteItem($id: uuid!) {
              delete_items_by_pk(id: $id) {
                id
              }

              delete_item_ownership(where: {item_id: {_eq: $id}}) {
                affected_rows
              }
            }
          `,
          variables: {
            id: item.value.id
          },
          context: store.graphqlContext
        }).then(() => {
          store.refreshItems();
          router.push({name: 'items'});
        });
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  })
}


const fetchItem = async () => {
  loading.value = true;
  const response = await window.apolloClient.query({
    query: gql`
      query GetItem($id: uuid!) {
        items_by_pk(id: $id) {
          id
          name
          description
          price
          stock_reserved
          stock_available
          stock_minimum
          purchase_locations
          orders {
            id
            order_state
            created_at
            count
          }
          owned_by {
            user {
              username
            }
            quantity
          }
        }
      }
    `,
    variables: {
      id: route.params.id
    },
    context: store.graphqlContext,
    fetchPolicy: 'no-cache'
  });

  graphqlItem.value = response.data.items_by_pk;
  loading.value = false;
};

let tableHeaders = [
  { title: 'User', key: 'user.username' },
  { title: 'Quantity', key: 'quantity' },
];

fetchItem();

</script>

<template>
  <v-container v-if="!loading">
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <v-card>
          <v-card-title class="headline">{{ graphqlItem.name }}</v-card-title>
          <v-card-text v-if="graphqlItem.description">{{ graphqlItem.description }}</v-card-text>
          <v-chip-group class="ml-2">
            <a v-for="location in graphqlItem.purchase_locations" :href="location.url" target="_blank">
              <v-chip
                  :key="location"
                  class="ma-2"
              >
                <a :href="location">{{location}}</a>
              </v-chip>
            </a>
          </v-chip-group>
          <v-card-text>
            <v-list>
              <div class="item-detail">
                <strong>Price:</strong> ${{ graphqlItem.price.toFixed(2) }}
              </div>
              <div class="item-detail">
                <strong>Stock Reserved:</strong> {{ graphqlItem.stock_reserved }}
                <v-btn text small color="darken-1" @click="updateStock('reserved', -1)" :disabled="graphqlItem.stock_reserved <= 0">
                  <v-icon small>mdi-minus</v-icon>
                </v-btn>
                <v-btn text small color="darken-1" @click="updateStock('reserved', 1)">
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </div>
              <div class="item-detail">
                <strong>Stock Available:</strong> {{ graphqlItem.stock_available }}
                <v-btn text small color="darken-1" @click="updateStock('available', -1)" :disabled="graphqlItem.stock_available <= 0">
                  <v-icon small>mdi-minus</v-icon>
                </v-btn>
                <v-btn text small color="darken-1" @click="updateStock('available', 1)">
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </div>
              <div class="item-detail">
                <strong>Stock Minimum:</strong> {{ graphqlItem.stock_minimum }}
                <v-btn text small color="darken-1" @click="updateStock('minimum', -1)" :disabled="graphqlItem.stock_minimum <= 0">
                  <v-icon small>mdi-minus</v-icon>
                </v-btn>
                <v-btn text small color="darken-1" @click="updateStock('minimum', 1)">
                  <v-icon small>mdi-plus</v-icon>
                </v-btn>
              </div>
              <v-list-item v-if="graphqlItem.purchase_locations && graphqlItem.purchase_locations.length > 0">
                <v-list-item-title>Shopping Locations</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip-group>
                    <a v-for="location in postprocessedShoppingLocations" :href="location.url" target="_blank">
                      <v-chip
                          :key="location"
                          class="ma-2"
                      >
                        {{ location.hostname }}
                      </v-chip>
                    </a>
                  </v-chip-group>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <AddItemToUser :itemid="graphqlItem.id"></AddItemToUser>
          </v-card-text>
          <v-card-actions>
            <RouterLink :to="{ name: 'items-edit', params: {id: graphqlItem.id} }">
              <v-btn color="primary">Edit Item</v-btn>
            </RouterLink>
            <v-btn color="red" @click="deleteItem">Delete Item</v-btn>
          </v-card-actions>
        </v-card>

        <v-divider class="ma-4"></v-divider>

        <h2>Users that own this item</h2>
        <v-data-table
            :headers="tableHeaders"
            :items="graphqlItem.owned_by"
            :items-per-page="10"
            class="elevation-1">
          <template v-slot:graphqlItem.quantity="{ item }">
            {{ item.quantity }}
          </template>
        </v-data-table>

        <v-divider class="ma-4"></v-divider>

        <h2>Order history</h2>
        <OrderTimeline :itemid="graphqlItem.id" />

      </v-col>
    </v-row>
  </v-container>
  <v-skeleton-loader v-else type="table"></v-skeleton-loader>
</template>


<style scoped>
.item-overview .v-card-title {
  font-size: 2em;
}

.item-detail {
  margin-bottom: 10px;
  font-size: 1.2em;
  display: flex;
  align-items: center;
}

.v-btn {
  margin-left: 5px;
}

.ma-2 {
  margin: 8px !important;
}
</style>
