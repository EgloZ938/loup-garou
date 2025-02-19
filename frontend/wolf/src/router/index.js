import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoomView from '../views/RoomView.vue'
import RolesView from '../views/RolesView.vue'
import RoleDetailView from '../views/RoleDetailView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/room/:roomCode',
            name: 'room',
            component: RoomView,
            props: true
        },
        {
            path: '/roles',
            name: 'roles',
            component: RolesView
        },
        {
            path: '/roles/:role',
            name: 'role-detail',
            component: RoleDetailView,
            props: true
        }

    ]
})

export default router