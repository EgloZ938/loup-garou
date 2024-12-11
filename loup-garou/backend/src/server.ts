import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Port par défaut de Vite
        methods: ["GET", "POST"]
    }
});

// Classes de base pour la gestion du jeu
class Player {
    constructor(
        public id: string,
        public username: string,
    ) { }
}

class GameRoom {
    players: Map<string, Player> = new Map();
    maxPlayers: number = 16;

    constructor(
        public roomId: string,
    ) { }

    addPlayer(player: Player): boolean {
        // Vérifie si le joueur existe déjà (par username)
        const existingPlayer = Array.from(this.players.values())
            .find(p => p.username === player.username);
        if (existingPlayer) {
            this.removePlayer(existingPlayer.id); // Supprime l'ancienne connexion
        }

        if (this.players.size >= this.maxPlayers) return false;
        this.players.set(player.id, player);
        return true;
    }

    removePlayer(playerId: string) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            return player;
        }
        return null;
    }

    getPlayersInfo() {
        // Renvoie un tableau avec des usernames uniques
        const uniquePlayers = Array.from(new Set(
            Array.from(this.players.values()).map(p => p.username)
        ));

        return {
            playerCount: uniquePlayers.length,
            maxPlayers: this.maxPlayers,
            players: uniquePlayers
        };
    }
}

class GameManager {
    rooms: Map<string, GameRoom> = new Map();

    createRoom(): string {
        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.rooms.set(roomId, new GameRoom(roomId));
        return roomId;
    }

    getRoom(roomId: string): GameRoom | undefined {
        return this.rooms.get(roomId);
    }

    removeRoom(roomId: string) {
        this.rooms.delete(roomId);
    }
}

const gameManager = new GameManager();

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create_room', ({ username }) => {
        try {
            const roomId = gameManager.createRoom();
            const player = new Player(socket.id, username);
            const room = gameManager.getRoom(roomId)!;

            if (room.addPlayer(player)) {
                socket.join(roomId);
                io.to(roomId).emit('room_created', {
                    roomId,
                    playersInfo: room.getPlayersInfo()
                });
                console.log(`Room ${roomId} created by ${username}`);
            }
        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit('error', { message: 'Erreur lors de la création de la room' });
        }
    });

    socket.on('join_room', ({ roomId, username }) => {
        try {
            const room = gameManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Cette room n\'existe pas' });
                return;
            }

            const player = new Player(socket.id, username);
            if (room.addPlayer(player)) {
                socket.join(roomId);
                // Notifie le joueur qui rejoint
                socket.emit('room_joined', {
                    roomId,
                    playersInfo: room.getPlayersInfo()
                });
                // Notifie les autres joueurs
                socket.to(roomId).emit('player_joined', {
                    username,
                    playersInfo: room.getPlayersInfo()
                });
                console.log(`${username} joined room ${roomId}`);
            } else {
                socket.emit('error', { message: 'La room est pleine' });
            }
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Erreur lors de la connexion à la room' });
        }
    });

    socket.on('chat_message', ({ roomId, message }) => {
        const room = gameManager.getRoom(roomId);
        if (room && room.players.has(socket.id)) {
            const player = room.players.get(socket.id)!;
            io.to(roomId).emit('chat_message', {
                username: player.username,
                message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        for (const [roomId, room] of gameManager.rooms) {
            const removedPlayer = room.removePlayer(socket.id);
            if (removedPlayer) {
                // Envoie la notification seulement si un joueur a été supprimé
                io.to(roomId).emit('player_left', {
                    username: removedPlayer.username,
                    playersInfo: room.getPlayersInfo()
                });

                if (room.players.size === 0) {
                    gameManager.removeRoom(roomId);
                    console.log(`Room ${roomId} removed`);
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});