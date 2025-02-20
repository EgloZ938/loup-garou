const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
require('dotenv').config();
const OpenAI = require('openai');


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 6;
const rooms = new Map();
const roomCreators = new Map();
const gameStatus = new Map();

// Fonction pour obtenir les rôles via OpenAI
async function assignRoles(players) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            "messages": [{
                "role": "user",
                "content": `Assigne des rôles du jeu Loup-Garou à ces joueurs de manière TOTALEMENT ALÉATOIRE : ${players.join(', ')}.

                ### Étapes d'attribution (TRÈS IMPORTANT) :
                1. Mélange d'abord la liste des joueurs de manière aléatoire
                2. Détermine ensuite le nombre de chaque rôle nécessaire selon les règles
                3. Attribue les rôles aux joueurs mélangés
                
                ### Règles générales d'équilibrage :
                - **Le nombre de Loups-Garous doit représenter environ 1/3 des joueurs**.
                - **Il doit toujours y avoir une Voyante** pour l'équilibre du jeu.
                - **La Sorcière est un rôle essentiel et doit être présente dans la majorité des parties**.
                - **Cupidon et le Salvateur doivent être uniques** (1 seul de chaque par partie).
                - **Les rôles actifs (qui agissent la nuit) ne doivent pas être trop nombreux** pour ne pas ralentir le jeu.
                - **Il doit rester suffisamment de Simples Villageois** pour conserver l'équilibre.
                
                ### Liste des rôles standards :
                #### 🐺 Camp des Loups-Garous :
                - **Loup-Garou (1/3 des joueurs, minimum 2)** : Chaque nuit, ils se concertent pour éliminer un joueur.
                - **Infect Père des Loups (optionnel, si +8 joueurs)** : Peut transformer une victime en Loup-Garou une fois par partie.
                
                #### 🌙 Camp des Villageois :
                - **Voyante (obligatoire)** : Chaque nuit, elle peut espionner le rôle d'un joueur.
                - **Sorcière (obligatoire, dès 5 joueurs)** : Possède une potion de vie pour ressusciter un joueur et une potion de mort pour en éliminer un.
                - **Chasseur (optionnel)** : S'il est éliminé, il peut tuer un joueur de son choix avant de mourir.
                - **Cupidon (optionnel, 1 max)** : Peut lier deux joueurs au début de la partie. Si l'un meurt, l'autre meurt aussi.
                - **Salvateur (optionnel, 1 max)** : Chaque nuit, protège un joueur contre l'attaque des Loups-Garous.
                - **Ancien (optionnel, si +8 joueurs)** : Résiste à la première attaque des Loups-Garous mais s'il meurt, les pouvoirs des autres villageois disparaissent.
                - **Bouc Émissaire (optionnel, si +8 joueurs)** : Est automatiquement éliminé en cas d'égalité lors du vote du village.
                - **Villageois (rôle neutre)** : Aucun pouvoir, mais vote pour éliminer les Loups-Garous.
                - **Renard (optionnel, si +8 joueurs)** : Peut flairer un groupe de 3 joueurs pour savoir si un Loup-Garou est présent.
                - **Corbeau (optionnel, si +8 joueurs)** : Désigne un joueur chaque nuit qui recevra **2 votes supplémentaires** au prochain vote du village.
                
                #### 🎭 Rôles neutres (ni Villageois ni Loups-Garous) :
                - **Joueur de Flûte (optionnel, si +8 joueurs)** : Chaque nuit, il charme des joueurs. S'il les charme tous, il gagne seul.
                

                ### FORMAT EXACT DES NOMS DE RÔLES (TRÈS IMPORTANT) :
                - "Loup-Garou" (pas "Loups-Garous" ni "Loup Garou")
                - "Infect Père des Loups" (exactement comme écrit)
                - "Voyante"
                - "Sorcière"
                - "Chasseur"
                - "Cupidon"
                - "Salvateur"
                - "Ancien"
                - "Bouc Émissaire"
                - "Villageois"
                - "Joueur de Flûte"
                - "Renard"
                - "Corbeau"

                Ces noms doivent être utilisés EXACTEMENT comme écrits ci-dessus dans la réponse JSON.
                
                Format de réponse : {"players":[{"pseudo":"[nom]","role":"[role]","camp":"Loups-Garous ou Villageois ou Neutre"}]}
                
                ATTENTION: Réponse UNIQUEMENT en JSON brut. Pas de texte avant/après. Pas de "Rôles attribués:", pas de "\`\`\`json".
                - Loups-Garous : camp = "Loups-Garous"
                - Villageois : camp = "Villageois"
                - Rôles neutres : camp = "Neutre"`
            }]
        });

        const roleAssignments = completion.choices[0].message.content;
        return roleAssignments;
    } catch (error) {
        console.error('Erreur OpenAI:', error);
        return null;
    }
}

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
                        // Nettoyage supplémentaire de la réponse
                        const cleanedResponse = roleAssignments
                            .replace(/^[^{]*/, '') // Enlève tout ce qui précède le premier {
                            .replace(/[^}]*$/, '') // Enlève tout ce qui suit le dernier }
                            .trim(); // Enlève les espaces inutiles

                        try {
                            // On vérifie que c'est bien du JSON valide
                            const parsedRoles = JSON.parse(cleanedResponse);

                            gameStatus.set(roomCode, true);
                            io.to(roomCode).emit('gameStatus', {
                                started: true,
                                roles: cleanedResponse // On envoie la version nettoyée
                            });
                            io.to(roomCode).emit('systemMessage', 'La partie commence !');
                        } catch (parseError) {
                            console.error('Erreur de parsing JSON:', parseError);
                            io.to(roomCode).emit('systemMessage', 'Erreur lors du lancement de la partie');
                        }
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'attribution des rôles:', error);
                    io.to(roomCode).emit('systemMessage', 'Erreur lors du lancement de la partie');
                }
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