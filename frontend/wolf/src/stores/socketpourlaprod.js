import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useSocketStore = defineStore('socket', {
    state: () => ({
        socket: io('/', {
            path: '/socket.io',
            transports: ['polling']
        }),
        username: null
    }),
    actions: {
        setUsername(username) {
            this.username = username;
        }
    }
});