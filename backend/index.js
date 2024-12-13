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

  socket.on('checkRoom', (roomCode) => {
    socket.emit('roomCheck', rooms.has(roomCode));
  });

  socket.on('createRoom', ({ username }) => {
    const roomCode = Math.random().toString(36).substring(7);
    rooms.set(roomCode, new Set([username]));
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
    io.to(roomCode).emit('userList', Array.from(rooms.get(roomCode)));
    io.to(roomCode).emit('systemMessage', `${username} a créé la partie`);
  });

  socket.on('joinRoom', ({ username, room }) => {
    if (rooms.has(room)) {
      rooms.get(room).add(username);
      socket.join(room);
      io.to(room).emit('userList', Array.from(rooms.get(room)));
      io.to(room).emit('systemMessage', `${username} a rejoint la partie`);
    }
  });

  socket.on('chatMessage', ({ username, room, message }) => {
    io.to(room).emit('message', {
      type: 'chat',
      username,
      content: message
    });
  });

  socket.on('leaveRoom', ({ username, room }) => {
    if (rooms.has(room)) {
      rooms.get(room).delete(username);
      socket.leave(room);
      
      if (rooms.get(room).size === 0) {
        rooms.delete(room);
      } else {
        io.to(room).emit('userList', Array.from(rooms.get(room)));
        io.to(room).emit('systemMessage', `${username} a quitté la partie`);
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