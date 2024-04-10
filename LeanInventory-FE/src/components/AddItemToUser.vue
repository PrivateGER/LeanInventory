<script setup>
import {useGlobalStore} from "@/stores/global-store";
import {computed, ref} from "vue";
import Swal from "sweetalert2";
import {gql} from "graphql-tag";

const props = defineProps({
  itemid: {
    type: String,
    required: true
  }
});

const store = useGlobalStore();
store.refreshItems()
store.fetchUsers()

const pickedUser = ref("");

const item = computed(() => {
  return store.items.find(item => item.id === props.itemid);
});

async function modifyItemStock(count) {
  return fetch(window.API_BASE_URL + "/items/update", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + store.token,
    },
    body: JSON.stringify({
      id: props.itemid,
      stock_available: parseInt(item.value.stock_available) + count
    })
  });
}

async function addItem() {
  let userid = store.usernameToId(pickedUser.value)

  await store.fetchDeepUserMetadata(pickedUser.value)

  // Check whether this ownership record already exists
  let res = await window.apolloClient.query({
    query: gql`
      query GetItemOwnership($userid: String!, $itemid: uuid!) {
        item_ownership_by_pk(user_id: $userid, item_id: $itemid) {
          quantity
        }
      }
    `,
    variables: {
      userid: pickedUser.value,
      itemid: props.itemid
    },
    context: store.graphqlContext,
    fetchPolicy: "no-cache",
  });

  let quantity = 1

  let updateMutation = null;
  if (res.data.item_ownership_by_pk !== null) {
    quantity = res.data.item_ownership_by_pk.quantity + 1
    updateMutation = gql`
      mutation UpdateItemQuantity($userid: String!, $itemid: uuid!, $quantity: Int!) {
        update_item_ownership(where: {user_id: {_eq: $userid}, item_id: {_eq: $itemid}}, _set: {quantity: $quantity}) {
          affected_rows
        }
      }
    `
  } else {
    updateMutation = gql`
      mutation AddItemToUser($userid: String!, $itemid: uuid!, $quantity: Int!) {
        insert_item_ownership_one(object: {user_id: $userid, item_id: $itemid, quantity: $quantity}) {
          quantity
        }
      }
    `
  }

  window.apolloClient.mutate({
    mutation: updateMutation,
    variables: {
      userid: pickedUser.value,
      itemid: props.itemid,
      quantity: quantity
    },
    context: store.graphqlContext,
  })
      .then(async data => {
        Swal.fire({
          title: 'Success',
          text: 'Item added to user. Please refresh the page to see the changes.',
          icon: 'success',
          confirmButtonText: 'OK'
        })

        if (modifyItemStock.value) {
          await modifyItemStock(1)
          Swal.fire({
            title: 'Success',
            text: 'Item stock incremented',
            icon: 'success',
            confirmButtonText: 'OK',
            toast: true,
            timer: 3000
          })
        }

      })
      .catch(error => {
        console.error('Error adding item:', error);
      });
}

async function removeItem() {
  let userid = store.usernameToId(pickedUser.value)

  await store.fetchDeepUserMetadata(pickedUser.value)

  // Check item quantity
  let res = await window.apolloClient.query({
    query: gql`
      query GetItemOwnership($userid: String!, $itemid: uuid!) {
        item_ownership_by_pk(user_id: $userid, item_id: $itemid) {
          quantity
        }
      }
    `,
    variables: {
      userid: pickedUser.value,
      itemid: props.itemid
    },
    context: store.graphqlContext,
    fetchPolicy: "no-cache",
  });

  let quantity = 1
  if (res.data.item_ownership_by_pk) {
    quantity = res.data.item_ownership_by_pk.quantity - 1
  }

  if (quantity <= 0) {
    await window.apolloClient.mutate({
      mutation: gql`
        mutation RemoveItemFromUser($userid: String!, $itemid: uuid!, $quantity: Int!) {
          delete_item_ownership(where: {user_id: {_eq: $userid}, item_id: {_eq: $itemid}, quantity: {_eq: $quantity}}) {
            affected_rows
          }
        }
      `,
      variables: {
        userid: pickedUser.value,
        itemid: props.itemid,
        quantity: quantity
      },
      context: store.graphqlContext
    });
  } else {
    await window.apolloClient.mutate({
      mutation: gql`
        mutation UpdateItemQuantity($userid: String!, $itemid: uuid!, $quantity: Int!) {
          update_item_ownership(where: {user_id: {_eq: $userid}, item_id: {_eq: $itemid}}, _set: {quantity: $quantity}) {
            affected_rows
          }
        }
      `,
      variables: {
        userid: pickedUser.value,
        itemid: props.itemid,
        quantity: quantity
      },
      context: store.graphqlContext
    });
    Swal.fire({
      title: 'Success',
      text: 'Item removed from user. Please refresh the page to see the changes.',
      icon: 'success',
      confirmButtonText: 'OK'
    })
  }

  if (modifyItemStock.value) {
    await modifyItemStock(-1)
    Swal.fire({
      title: 'Success',
      text: 'Item stock decremented',
      icon: 'success',
      confirmButtonText: 'OK',
      toast: true,
      timer: 3000
    })
  }

}

let checkboxModifyItemStock = ref(false);
</script>

<template>
  <v-card-title>Add/remove item from user inventory</v-card-title>

  <v-autocomplete :items="store.usernames" outlined placeholder="Username..." v-model="pickedUser"></v-autocomplete>
  <v-checkbox label="Also increment/decrement stock" v-model="checkboxModifyItemStock"></v-checkbox>
  <v-btn color="primary" @click="addItem">Add Item</v-btn>
  <v-btn color="primary" class="ml-4" @click="removeItem">Remove Item</v-btn>
</template>

<style scoped>

</style>