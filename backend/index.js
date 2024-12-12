// backend/index.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map(); // Stockage des rooms et leurs utilisateurs

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    // Vérifier si une room existe
    socket.on('checkRoom', (roomCode) => {
        socket.emit('roomCheck', rooms.has(roomCode));
    });

    socket.on('createRoom', ({ username }) => {
        const roomCode = Math.random().toString(36).substring(7);
        rooms.set(roomCode, new Set([username]));
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
        io.to(roomCode).emit('userList', Array.from(rooms.get(roomCode)));
    });

    socket.on('joinRoom', ({ username, room }) => {
        if (rooms.has(room)) {
            rooms.get(room).add(username);
            socket.join(room);
            io.to(room).emit('userList', Array.from(rooms.get(room)));
        }
    });

    socket.on('leaveRoom', ({ username, room }) => {
        if (rooms.has(room)) {
            rooms.get(room).delete(username);
            socket.leave(room);

            if (rooms.get(room).size === 0) {
                rooms.delete(room);
            } else {
                io.to(room).emit('userList', Array.from(rooms.get(room)));
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});