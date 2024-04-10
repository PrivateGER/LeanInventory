import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { gql } from 'graphql-tag';

export const useGlobalStore = defineStore('global', {
    state: () => {
        return {
            userName: 'Not logged in',
            token: '',
            admin: false,
            loggedIn: false,
            items: [],
            drawer: false,
            users: [],
            links: [
                { title: 'Dashboard', link: '/dashboard', public: false },
                { title: 'Login', link: '/login', public: true, special: 'login' },
                { title: 'Logout', link: '/logout', public: false, special: 'logout' },
            ],
            apolloClient: null,
        }
    },
    getters: {
        loggedInUser: (state) => state.loggedIn,
        visibleLinks: (state) => state.links.filter(item => {
            if (item.special === 'login' && state.loggedIn) return false;
            if (item.special === 'logout' && !state.loggedIn) return false;
            if (item.public) return true;
            return state.loggedIn;
        }),
        isAdmin: (state) => state.admin,
        allCategories: (state) => {
            let categories = []
            state.items.forEach(item => {
                item.categories.forEach(category => {
                    if (!categories.includes(category)) {
                        categories.push(category)
                    }
                })
            })
            return categories
        },
        userTable: state => {
            return state.users.map(user => {
                return {
                    id: user.id,
                    username: user.username,
                    admin: user.admin,
                }
            })
        },
        usernames: state => {
            return state.users.map(user => user.username)
        },
        usernameToId: state => {
            return (userid) => state.users.find(user => user.username === userid).id
        },
        graphqlContext: state => {
            return {
                headers: {
                    Authorization: state.token ? `Bearer ${state.token}` : "MISSING????",
                }
            }
        }
    },
    actions: {
        changeLoginState(token, username, admin) {
            this.token = token
            this.userName = username
            this.admin = admin
            this.loggedIn = true
            window.localStorage.setItem('token', token)
            this.token = token
        },

        async refreshItems() {
            console.log("Refreshing items")
            let response = await window.apolloClient.query({
                query: gql`
                    query itemQuery {
                        items {
                            id
                            name
                            categories
                            description
                            price
                            stock_available
                            stock_minimum
                            stock_reserved
                            purchase_locations
                            categories
                            
                        }
                    }
                `, context: this.graphqlContext,
                fetchPolicy: "no-cache"
            });

            this.items = response.data.items

        },

        async fetchUsers() {
            let response = await window.apolloClient.query({
                query: gql`
                    query userQuery {
                        users {
                            username
                            admin
                        }
                    }
                `, context: this.graphqlContext,
                fetchPolicy: "no-cache"
            });

            this.users = response.data.users
        },

        async fetchDeepUserMetadata(username) {
            let response = await window.apolloClient.query({
                query: gql`
                    query userQuery($username: String!) {
                        users_by_pk(username: $username) {
                            username
                            admin
                            owned_items {
                                item {
                                    id
                                    name
                                    categories
                                    description
                                    price
                                    stock_available
                                    stock_minimum
                                    stock_reserved
                                    purchase_locations
                                    categories
                                }
                                quantity
                            }
                        }
                    }
                `, context: this.graphqlContext,
                variables: {
                    username
                },
                fetchPolicy: "no-cache"
            });

            console.log(response.data.users_by_pk)

            // Update or add the user to the store
            let user = this.users.find(user => user.username === username)
            if (!user) {

                this.users.push(response.data.users_by_pk)
            } else {
                // Replace the user with the new data in the store
                let index = this.users.indexOf(user)
                this.users[index] = response.data.users_by_pk
            }
        },
    },
})
