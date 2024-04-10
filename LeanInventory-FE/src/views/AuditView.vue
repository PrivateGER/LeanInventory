<script setup>
import {ref, onMounted, nextTick} from "vue";
import { useGlobalStore } from "@/stores/global-store";

const page = ref(0);
const items = ref([]);
const loading = ref(false);
const allItemsLoaded = ref(false);

const store = useGlobalStore();

onMounted(() => {
  fetchItems();
});

const loadMore = () => {
  if (!loading.value && !allItemsLoaded.value) {
    page.value++;
    fetchItems();
  }
};

const fetchItems = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${window.API_BASE_URL}/audit/all?page=${page.value}&per_page=25&key=${store.token}`);
    const data = await response.json();
    if (data.entries.length === 0) {
      allItemsLoaded.value = true;
    } else {
      items.value = [...items.value, ...data.entries];
      checkIfMoreItemsNeeded();
    }
  } catch (error) {
    console.error("Error fetching items:", error);
  } finally {
    loading.value = false;
  }
};

const checkIfMoreItemsNeeded = () => {
  // Use nextTick to wait for the DOM to update
  nextTick(() => {
    const containerHeight = document.querySelector('.container-class-name').clientHeight;
    const windowHeight = window.innerHeight;
    if (containerHeight < windowHeight && !allItemsLoaded.value) {
      loadMore();
    }
  });
};
</script>


<template>
  <v-card>
    <v-card-title>
      Audit Log
    </v-card-title>
    <v-card-subtitle>
      View all actions taken by users.
    </v-card-subtitle>
    <v-card-text>
      <v-list>
        <v-list-item-group v-if="items.length > 0">
          <v-list-item v-for="item in items" :key="item.id">
            <v-list-item-content>
              <v-row>
                <v-col cols="12" md="3">
                  <strong>{{ item.username }}</strong>
                </v-col>
                <v-col cols="12" md="3">
                  {{ item.action }}
                </v-col>
                <v-col cols="12" md="3">
                  {{ item.created_at }}
                </v-col>
              </v-row>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
        <v-list-item v-else>
          <v-list-item-content>No items found</v-list-item-content>
        </v-list-item>
      </v-list>
      <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
    </v-card-text>
    <div v-intersect="{ handler: loadMore, options: { rootMargin: '40px' } }"></div>
  </v-card>
</template>


<style scoped>
.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.v-list-item:last-child {
  border-bottom: none;
}
</style>