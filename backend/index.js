const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 6;
const rooms = new Map();
const roomCreators = new Map();
const gameStatus = new Map();

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('checkRoom', (roomCode) => {
        const roomExists = rooms.has(roomCode);
        const currentPlayers = roomExists ? rooms.get(roomCode).size : 0;
        socket.emit('roomCheck', {
            exists: roomExists,
            creator: roomExists ? roomCreators.get(roomCode) : null,
            isFull: currentPlayers >= MAX_PLAYERS
        });
    });

    socket.on('createRoom', ({ username }) => {
        const roomCode = Math.random().toString(36).substring(7);
        rooms.set(roomCode, new Set([username]));
        roomCreators.set(roomCode, username);
        gameStatus.set(roomCode, false);

        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);

        io.to(roomCode).emit('userList', {
            users: Array.from(rooms.get(roomCode)),
            creator: username
        });

        io.to(roomCode).emit('gameStatus', {
            started: false
        });

        io.to(roomCode).emit('systemMessage', `${username} a créé la partie (1/${MAX_PLAYERS})`);
    });

    socket.on('joinRoom', ({ username, room }) => {
        if (rooms.has(room)) {
            const currentPlayers = rooms.get(room).size;

            if (currentPlayers >= MAX_PLAYERS) {
                socket.emit('systemMessage', 'La room est complète !');
                return;
            }

            rooms.get(room).add(username);
            socket.join(room);

            const newPlayerCount = rooms.get(room).size;

            io.to(room).emit('userList', {
                users: Array.from(rooms.get(room)),
                creator: roomCreators.get(room)
            });

            io.to(room).emit('gameStatus', {
                started: gameStatus.get(room)
            });

            io.to(room).emit('systemMessage', `${username} a rejoint la partie (${newPlayerCount}/${MAX_PLAYERS})`);
        }
    });

    // Ajout de l'événement chat manquant
    socket.on('chatMessage', ({ username, room, message }) => {
        io.to(room).emit('message', {
            type: 'chat',
            username,
            content: message
        });
    });

    socket.on('startGame', (roomCode) => {
        if (rooms.has(roomCode)) {
            const currentPlayers = rooms.get(roomCode).size;
            if (currentPlayers >= MIN_PLAYERS) {
                gameStatus.set(roomCode, true);
                io.to(roomCode).emit('gameStatus', { started: true });
                io.to(roomCode).emit('systemMessage', 'La partie commence !');
            }
        }
    });

    socket.on('leaveRoom', ({ username, room }) => {
        if (rooms.has(room)) {
            rooms.get(room).delete(username);
            socket.leave(room);

            if (rooms.get(room).size === 0) {
                rooms.delete(room);
                roomCreators.delete(room);
                gameStatus.delete(room);
            } else {
                if (roomCreators.get(room) === username) {
                    const newCreator = Array.from(rooms.get(room))[0];
                    roomCreators.set(room, newCreator);
                    io.to(room).emit('systemMessage', `${newCreator} devient le chef de la partie`);
                }

                const remainingPlayers = rooms.get(room).size;
                io.to(room).emit('userList', {
                    users: Array.from(rooms.get(room)),
                    creator: roomCreators.get(room)
                });

                io.to(room).emit('systemMessage', `${username} a quitté la partie (${remainingPlayers}/${MAX_PLAYERS})`);
            }
        }
    });

    socket.on('promotePlayer', ({ room, newCreator, currentCreator }) => {
        if (rooms.has(room) && roomCreators.get(room) === currentCreator) {
            roomCreators.set(room, newCreator);
            io.to(room).emit('userList', {
                users: Array.from(rooms.get(room)),
                creator: newCreator
            });
            io.to(room).emit('systemMessage', `${newCreator} est maintenant le chef de la partie`);
        }
    });

    socket.on('kickPlayer', ({ room, username }) => {
        if (rooms.has(room)) {
            const creator = roomCreators.get(room);
            const currentUser = socket.handshake.auth?.username;

            console.log('Debug kick :', {
                creator,
                currentUser,
                userToKick: username,
                socketAuth: socket.handshake.auth
            });

            // Vérification que la demande vient du créateur
            if (creator === currentUser) {
                rooms.get(room).delete(username);

                // Notifier tout le monde du kick
                io.to(room).emit('userList', {
                    users: Array.from(rooms.get(room)),
                    creator: roomCreators.get(room)
                });
                io.to(room).emit('systemMessage', `${username} a été exclu(e) de la partie`);
                io.to(room).emit('playerKicked', { username });
            } else {
                console.log('Tentative de kick non autorisée:', {
                    requestBy: currentUser,
                    creator: creator
                });
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