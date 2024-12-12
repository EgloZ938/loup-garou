import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useSocketStore = defineStore('socket', {
    state: () => ({
        socket: io('http://localhost:3000'),
        username: null
    }),

    actions: {
        setUsername(username) {
            this.username = username;
        }
    }
});