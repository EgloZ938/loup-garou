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
const { GameManager } = require('./gameLogic');


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const MAX_PLAYERS = 16;
const MIN_PLAYERS = 6;
const rooms = new Map();
const roomCreators = new Map();
const gameStatus = new Map();
const gameReadyPlayers = new Map();

const gameManager = new GameManager();

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createManualRoleAssignments(players, manualRoles) {
    try {
        // Mélanger les joueurs pour une attribution aléatoire
        const shuffledPlayers = shuffleArray([...players]);

        // Vérifier que nous avons le bon nombre de rôles
        if (manualRoles.length !== players.length) {
            console.error('Erreur: Le nombre de rôles ne correspond pas au nombre de joueurs');
            return null;
        }

        // Mélanger les rôles également pour éviter les attributions prévisibles
        const shuffledRoles = shuffleArray([...manualRoles]);

        // Créer le tableau de résultats qui associe chaque joueur à un rôle
        const result = {
            players: shuffledPlayers.map((player, index) => ({
                pseudo: player,
                role: shuffledRoles[index].role,
                camp: shuffledRoles[index].camp
            }))
        };

        return JSON.stringify(result);
    } catch (error) {
        console.error('Erreur lors de la création des assignations de rôles manuelles:', error);
        return null;
    }
}

// Fonction pour obtenir les rôles via OpenAI
async function assignRoles(players) {
    try {

        // Mélanger les joueurs avant de les envoyer à ChatGPT
        const shuffledPlayers = shuffleArray([...players]);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            "messages": [{
                "role": "user",
                "content": `Assigne des rôles du jeu Loup-Garou à ces joueurs : ${shuffledPlayers.join(', ')}.

                ### RÈGLES CRITIQUES DE VALIDATION :
                - La réponse DOIT contenir EXACTEMENT ${players.length} joueurs, ni plus ni moins
                - Chaque joueur de la liste DOIT recevoir un rôle
                - Vérifier que TOUS les pseudos de la liste initiale sont présents dans la réponse
                
                ### Règles générales d'équilibrage :
                - **Le nombre de Loups-Garous doit représenter environ 1/3 des joueurs MINIMUM 2**.
                - **Il doit toujours y avoir une Voyante** pour l'équilibre du jeu.
                - **La Sorcière est un rôle essentiel et doit être présente dans la majorité des parties**.
                - **Cupidon et le Salvateur doivent être uniques** (1 seul de chaque par partie).
                - **Les rôles actifs (qui agissent la nuit) ne doivent pas être trop nombreux** pour ne pas ralentir le jeu.
                - **Il doit rester suffisamment de Simples Villageois** pour conserver l'équilibre.
                
                ### Liste des rôles standards :
                #### 🐺 Camp des Loups-Garous :
                - **Loup-Garou (1/3 des joueurs, MINIMUM 2)** : Chaque nuit, ils se concertent pour éliminer un joueur.
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

function assignRolesAlgorithm(players) {
    // Crée une copie mélangée des joueurs
    const shuffledPlayers = shuffleArray([...players]);
    const playerCount = players.length;
    const roles = [];

    // Déterminer le nombre de loups-garous en fonction du nombre de joueurs
    let werewolfCount;
    let includeInfectFatherOfWerewolves = false;

    if (playerCount < 8) {
        werewolfCount = 2;
    } else if (playerCount < 12) {
        werewolfCount = 2;
        // 30% de chance d'avoir l'Infect Père des Loups à la place d'un Loup-Garou normal
        includeInfectFatherOfWerewolves = Math.random() < 0.3;
    } else if (playerCount < 16) {
        werewolfCount = 3;
        // 50% de chance d'avoir l'Infect Père des Loups à la place d'un Loup-Garou normal
        includeInfectFatherOfWerewolves = Math.random() < 0.5;
    } else {
        werewolfCount = 4;
        // 70% de chance d'avoir l'Infect Père des Loups à la place d'un Loup-Garou normal
        includeInfectFatherOfWerewolves = Math.random() < 0.7;
    }

    // Rôles obligatoires (toujours présents)
    const mandatoryRoles = ['Voyante', 'Sorcière'];

    // Rôles additionnels pour les parties plus grandes
    const additionalRoles = [
        'Chasseur',
        'Cupidon',
        'Salvateur',
        ...(playerCount >= 8 ? ['Ancien', 'Bouc Émissaire', 'Renard', 'Corbeau'] : []),
        ...(playerCount >= 10 ? ['Joueur de Flûte'] : [])
    ];

    // Mélanger les rôles additionnels
    shuffleArray(additionalRoles);

    // Calculer combien de rôles additionnels on peut inclure
    // (en gardant un certain nombre de simples villageois pour l'équilibre)
    const minVillageois = Math.max(Math.floor(playerCount * 0.3), 1); // Au moins 30% de simples villageois
    const maxAdditionalRoles = playerCount - werewolfCount - mandatoryRoles.length - minVillageois;
    const selectedAdditionalRoles = additionalRoles.slice(0, Math.min(maxAdditionalRoles, additionalRoles.length));

    // Construction de la liste finale des rôles
    const finalRoles = [
        ...Array(includeInfectFatherOfWerewolves ? werewolfCount - 1 : werewolfCount).fill('Loup-Garou'),
        ...(includeInfectFatherOfWerewolves ? ['Infect Père des Loups'] : []),
        ...mandatoryRoles,
        ...selectedAdditionalRoles,
    ];

    // Compléter avec des Villageois jusqu'à avoir le bon nombre
    while (finalRoles.length < playerCount) {
        finalRoles.push('Villageois');
    }

    // Mélanger tous les rôles
    shuffleArray(finalRoles);

    // Assigner les rôles aux joueurs
    const result = {
        players: shuffledPlayers.map((player, index) => {
            const role = finalRoles[index];
            const camp = (role === 'Loup-Garou' || role === 'Infect Père des Loups')
                ? 'Loups-Garous'
                : (role === 'Joueur de Flûte' ? 'Neutre' : 'Villageois');

            return { pseudo: player, role, camp };
        })
    };

    return JSON.stringify(result);
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
            usedUsernames: usedUsernames
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

            // Vérifier si le jeu est déjà en cours
            const gameRunning = gameStatus.get(room);
            io.to(room).emit('gameStatus', {
                started: gameRunning
            });

            // Si le jeu est en cours, envoyer l'état actuel du jeu au joueur qui rejoint
            if (gameRunning) {
                const game = gameManager.getGame(room);
                if (game) {
                    const gameState = game.getGameState();
                    socket.emit('gameStateUpdate', gameState);
                }
            }

            io.to(room).emit('systemMessage', `${username} a rejoint la partie (${newPlayerCount}/${MAX_PLAYERS})`);
        }
    });

    socket.on('chatMessage', ({ username, room, message }) => {
        io.to(room).emit('message', {
            type: 'chat',
            username,
            content: message
        });
    });

    socket.on('startGame', async (roomCode, mode = 'auto', manualRoles = null) => {
        if (rooms.has(roomCode)) {
            const currentPlayers = Array.from(rooms.get(roomCode));
            if (currentPlayers.length >= MIN_PLAYERS) {
                io.to(roomCode).emit('startCountdown');
                try {
                    let roleAssignments;

                    if (mode === 'auto') {
                        // Utiliser l'algorithme existant d'équilibrage automatique
                        roleAssignments = assignRolesAlgorithm(currentPlayers);
                    } else if (mode === 'manual' && manualRoles) {
                        // Utiliser les rôles sélectionnés manuellement
                        roleAssignments = createManualRoleAssignments(currentPlayers, manualRoles);
                    } else {
                        // Fallback sur l'équilibrage automatique en cas de problème
                        roleAssignments = assignRolesAlgorithm(currentPlayers);
                    }

                    if (roleAssignments) {
                        // Nettoyage supplémentaire de la réponse
                        const cleanedResponse = roleAssignments
                            .replace(/^[^{]*/, '') // Enlève tout ce qui précède le premier {
                            .replace(/[^}]*$/, '') // Enlève tout ce qui suit le dernier }
                            .trim(); // Enlève les espaces inutiles

                        try {
                            // On vérifie que c'est bien du JSON valide
                            JSON.parse(cleanedResponse);

                            // Marquer le jeu comme commencé
                            gameStatus.set(roomCode, true);

                            // Envoyer les rôles aux joueurs
                            io.to(roomCode).emit('gameStatus', {
                                started: true,
                                roles: cleanedResponse
                            });

                            // Créer et démarrer l'instance de jeu
                            const game = gameManager.createGame(roomCode, currentPlayers, io);
                            game.start(cleanedResponse);

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
                gameManager.removeGame(room);
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


    socket.on('castVote', ({ room, voter, votedFor }) => {
        if (rooms.has(room)) {
            const game = gameManager.getGame(room);

            if (game && game.currentPhase === 'vote') {
                const result = game.processVote(voter, votedFor);

                if (!result.success) {
                    // Envoyer un message d'erreur au client qui a tenté de voter
                    socket.emit('voteError', { message: result.message });
                }
            } else {
                socket.emit('voteError', { message: "Vous ne pouvez voter que pendant la phase de vote" });
            }
        }
    });

    // Dans la partie socket.io du serveur
    socket.on('playerReady', (roomCode) => {
        const username = socket.handshake.auth?.username;

        if (!username || !rooms.has(roomCode)) return;

        // Stocker les joueurs prêts (si pas encore initialisé)
        if (!gameReadyPlayers.has(roomCode)) {
            gameReadyPlayers.set(roomCode, new Set());
        }

        // Ajouter ce joueur aux joueurs prêts
        gameReadyPlayers.get(roomCode).add(username);

        // Vérifier si tous les joueurs sont prêts
        const readyPlayers = gameReadyPlayers.get(roomCode).size;
        const totalPlayers = rooms.get(roomCode).size;

        if (readyPlayers === totalPlayers) {
            // Tous les joueurs ont vu leur rôle, on peut commencer la phase de nuit
            const game = gameManager.getGame(roomCode);
            if (game) {
                // Supprimer la liste des joueurs prêts pour cette room
                gameReadyPlayers.delete(roomCode);

                // Démarrer le cycle de jeu (phase de nuit)
                setTimeout(() => {
                    game.startGameCycle();
                }, 1000); // Petit délai pour s'assurer que l'UI a bien eu le temps de se mettre en place
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