const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
// require('dotenv').config();
// const OpenAI = require('openai');


// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 6;
const rooms = new Map();
const roomCreators = new Map();
const gameStatus = new Map();
const votes = new Map();
const loupVotes = new Map();
const rolesAssignments = new Map();
const eliminatedPlayers = new Map();
const turnOrders = new Map();
const currentTurnIndex = new Map();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function assignRoles(players) {
    try {
        const shuffledPlayers = shuffleArray([...players]);
        const completion = {
            "players": [
                {"pseudo": "J1", "role": "Loup-Garou", "camp": "Loups-Garous"},
                {"pseudo": "J2", "role": "Loup-Garou", "camp": "Loups-Garous"},
                {"pseudo": "J3", "role": "Voyante", "camp": "Villageois"},
                {"pseudo": "J4", "role": "Sorcière", "camp": "Villageois"},
                {"pseudo": "J5", "role": "Chasseur", "camp": "Villageois"},
                {"pseudo": "J6", "role": "Villageois", "camp": "Villageois"}
            ]
        };
        return completion; 
    } catch (error) {
        console.error('Erreur OpenAI:', error);
        return null;
    }
}

function computeTurnOrder(roomCode) {
    const assignments = rolesAssignments.get(roomCode);
    if (!assignments) return ["Village"];
    const players = assignments.players;
    // const hasVoyante = players.some(p => p.role === "Voyante");
    // const hasSorciere = players.some(p => p.role === "Sorcière");
    const order = ["Village"];
    // if (hasVoyante) order.push("Voyante");
    order.push("Loups");
    // if (hasSorciere) order.push("Sorcière");
    return order;
}

function nextTurn(roomCode) {
    if (!turnOrders.has(roomCode)) return;
    let order = turnOrders.get(roomCode);
    let index = currentTurnIndex.get(roomCode);
    index = (index + 1) % order.length;
    currentTurnIndex.set(roomCode, index);
    const next = order[index];
    io.to(roomCode).emit("turnUpdate", { turn: next });
}


function getPlayerRole(player, completion) {
    const foundPlayer = completion.players.find(p => p.pseudo === player);
    return foundPlayer ? foundPlayer : null;
}


const getWerewolves = (roomCode) => {
    const assignments = rolesAssignments.get(roomCode);
    if (!assignments || !assignments.players) return [];
    return assignments.players
              .filter(player => player.camp === "Loups-Garous")
              .map(player => player.pseudo);
};

const checkVictory = (roomCode) => {
    if (!rooms.has(roomCode)) return;

    const alivePlayers = new Set(rooms.get(roomCode));
    if (eliminatedPlayers.has(roomCode)) {
        eliminatedPlayers.get(roomCode).forEach(player => alivePlayers.delete(player));
    }

    const completion = rolesAssignments.get(roomCode);
    if (!completion) return;

    const aliveRoles = [...alivePlayers].map(player => getPlayerRole(player, completion));

    const allWerewolves = aliveRoles.every(role => role?.camp === 'Loups-Garous');
    const allVillagers = aliveRoles.every(role => role?.camp === 'Villageois');

    if (allWerewolves) {
        io.to(roomCode).emit("gameOver", { winner: "Loups-Garous" });
        gameStatus.set(roomCode, false);
        console.log("victoire LOUP");
    } else if (allVillagers) {
        io.to(roomCode).emit("gameOver", { winner: "Villageois" });
        gameStatus.set(roomCode, false);
        console.log("victoire village");
    }
};



io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('checkRoom', (roomCode) => {
        const roomExists = rooms.has(roomCode);
        const currentPlayers = roomExists ? rooms.get(roomCode).size : 0;
        const usedUsernames = roomExists ? Array.from(rooms.get(roomCode)) : [];

        socket.emit('roomCheck', {
            exists: roomExists,
            creator: roomExists ? roomCreators.get(roomCode) : null,
            isFull: currentPlayers >= MAX_PLAYERS,
            usedUsernames: usedUsernames  // On envoie la liste des pseudos utilisés
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

    socket.on('startGame', async (roomCode) => {
        if (rooms.has(roomCode)) {
            const currentPlayers = Array.from(rooms.get(roomCode));
            if (currentPlayers.length >= MIN_PLAYERS) {
                io.to(roomCode).emit('startCountdown');
                try {
                    const roleAssignments = await assignRoles(currentPlayers);
                    if (roleAssignments) {

                        rolesAssignments.set(roomCode, roleAssignments);
                        gameStatus.set(roomCode, true);
                        io.to(roomCode).emit('gameStatus', {
                            started: true,
                            roles: roleAssignments 
                        });
                        io.to(roomCode).emit('systemMessage', 'La partie commence !');

                        const order = computeTurnOrder(roomCode);
                        turnOrders.set(roomCode, order);
                        currentTurnIndex.set(roomCode, 0);
                        io.to(roomCode).emit("turnUpdate", { turn: order[0] });
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'attribution des rôles:', error);
                    io.to(roomCode).emit('systemMessage', 'Erreur lors du lancement de la partie');
                }
            }
        }
    });

    socket.on('voteVillage', ({ roomCode, votedPlayer }) => {
        console.log(votes);
        if (!rooms.has(roomCode) || !gameStatus.get(roomCode)) return;
        
        if (!votes.has(roomCode)) {
            votes.set(roomCode, new Map());
        }
        const voteMap = votes.get(roomCode);
        voteMap.set(socket.id, votedPlayer);
        
        const alivePlayers = new Set(rooms.get(roomCode));
        if (eliminatedPlayers.has(roomCode)) {
            eliminatedPlayers.get(roomCode).forEach(player => alivePlayers.delete(player));
        }
        
        io.to(roomCode).emit('updateVotes', Array.from(voteMap.values()));
    
        if (voteMap.size === alivePlayers.size) {
            const counts = {};
            voteMap.forEach(v => counts[v] = (counts[v] || 0) + 1);
            const eliminated = Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
            io.to(roomCode).emit('playerEliminated', eliminated);
    
            if (!eliminatedPlayers.has(roomCode)) {
                eliminatedPlayers.set(roomCode, new Set());
            }
            eliminatedPlayers.get(roomCode).add(eliminated);
    
            votes.delete(roomCode);

            // // Vérifier si le joueur éliminé est un Chasseur
            // const eliminatedRole = getPlayerRole(eliminated, rolesAssignments.get(roomCode));
            // if (eliminatedRole && eliminatedRole.role === "Chasseur") {
            //     // En fonction du tour courant (jour), on envoie la phase Chasseur
            //     io.to(roomCode).emit("chasseurTurn", { eliminated });
            //     // La suite (transition vers le tour suivant) se fera après l'action du chasseur
            // } else {
            //     // Passer au tour suivant
               nextTurn(roomCode);
            // }
            
            checkVictory(roomCode);
        }
    });
    
    
    socket.on('voteLoups', ({ roomCode, votedPlayer }) => {
        if (!rooms.has(roomCode) || !gameStatus.get(roomCode)) return;
        if (!loupVotes.has(roomCode)) {
            loupVotes.set(roomCode, new Map());
        }
        const voteMap = loupVotes.get(roomCode);
        voteMap.set(socket.id, votedPlayer);
        
        const werewolves = getWerewolves(roomCode);
        if (voteMap.size === werewolves.length) {
            const counts = {};
            voteMap.forEach(v => counts[v] = (counts[v] || 0) + 1);
            const eliminated = Object.keys(counts).reduce((a, b) => counts[a] >= counts[b] ? a : b);
            io.to(roomCode).emit('playerEliminated', eliminated);
            if (!eliminatedPlayers.has(roomCode)) {
                eliminatedPlayers.set(roomCode, new Set());
            }
            eliminatedPlayers.get(roomCode).add(eliminated);
            loupVotes.delete(roomCode);
            
            // // Vérifier si le joueur éliminé est un Chasseur
            // const eliminatedRole = getPlayerRole(eliminated, rolesAssignments.get(roomCode));
            // if (eliminatedRole && eliminatedRole.role === "Chasseur") {
            //     io.to(roomCode).emit("chasseurTurn", { eliminated });
            // } else {
                nextTurn(roomCode);
            // }
            checkVictory(roomCode);

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