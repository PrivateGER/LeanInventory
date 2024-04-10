import {useGlobalStore} from "@/stores/global-store";

window.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost'

import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { jwtDecode } from "jwt-decode";

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { provide } from '@vue/composition-api'
import { DefaultApolloClient } from '@vue/apollo-composable'
const vuetify = createVuetify({
    components: {
        ...components,
    },
    directives: {
        ...directives,
    },
})

const validToken = !!localStorage.getItem('token')

// HTTP connection to the API
const httpLink = createHttpLink({
    // You should use an absolute URL here
    uri: import.meta.env.PROD ? '/hasura/v1/graphql' : 'http://localhost:8080/v1/graphql',
})

// Cache implementation
const cache = new InMemoryCache({

})


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

const store = useGlobalStore()


// Create the apollo client
const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
})

// Check for a localStorage token, verify it & get info, if valid then set the global store
const token = localStorage.getItem('token')
if(token) {
    // Parse token, check expiry
    const decoded = jwtDecode(token)
    if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem('token')
    } else {
        store.loggedIn = true
        store.userName = decoded.username
        store.admin = decoded.admin
        store.token = token
        apolloClient.link.headers = {
            ...apolloClient.link.headers,
            authorization: `Bearer ${localStorage.getItem('token')}`,
        }
    }

}

store.apolloClient = apolloClient

/// @type ApolloClient
window.apolloClient = apolloClient

router.beforeEach((to, from) => {
    if (to.meta.requiresAuth && !store.loggedIn) {
        return {
            path: '/login'
        }
    }
})

app.mount('#app')
