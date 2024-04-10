import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/logout',
            name: 'logout',
            component: () => import('../views/LogoutView.vue')
        },
        {
            path: '/items',
            name: 'items',
            component: () => import('../views/ItemListView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/items/create',
            name: 'items-create',
            component: () => import('../views/ModifyItemView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/items/:id/edit',
            name: 'items-edit',
            component: () => import('../views/ModifyItemView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/DashboardView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: '/about',
            name: 'about',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/AboutView.vue')
        },
        {
            path: '/users',
            name: 'users',
            component: () => import('../views/UserListView.vue'),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/audit",
            name: "audit",
            component: () => import("../views/AuditView.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/item/:id",
            name: "item",
            component: () => import("../views/ItemView.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/user/:name",
            name: "view-user",
            component: () => import("../views/UserView.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/orders",
            name: "order-list",
            component: () => import("../views/OrderList.vue"),
            beforeEnter: (to, from, next) => {
                next(vm => {
                    vm.fetchOrders();
                });
            },
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/order/create",
            name: "order-create",
            component: () => import("../views/OrderCreate.vue"),
            meta: {
                requiresAuth: true
            }
        },
        {
            path: "/reports",
            name: "reports",
            component: () => import("../views/ReportView.vue"),
            meta: {
                requiresAuth: true
            }
        }
    ]
})

export default router
