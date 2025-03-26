const { EventEmitter } = require('events');

class GameManager extends EventEmitter {
    constructor() {
        super();
        this.games = new Map(); // Stocke les instances de jeu par roomCode
        this.playerSockets = new Map(); // Map pour stocker les socketId des joueurs par username
    }

    // Crée une nouvelle instance de jeu pour une room
    createGame(roomCode, players, io) {
        if (this.games.has(roomCode)) {
            return this.games.get(roomCode);
        }

        const game = new Game(roomCode, players, io, this);
        this.games.set(roomCode, game);
        return game;
    }

    // Supprime une instance de jeu
    removeGame(roomCode) {
        if (this.games.has(roomCode)) {
            const game = this.games.get(roomCode);
            game.cleanup();
            this.games.delete(roomCode);
            return true;
        }
        return false;
    }

    // Récupère une instance de jeu existante
    getGame(roomCode) {
        return this.games.get(roomCode);
    }

    // Ajoute un socket pour un joueur
    addPlayerSocket(username, socketId) {
        this.playerSockets.set(username, socketId);
    }

    // Récupère le socketId d'un joueur
    getPlayerSocketId(username) {
        return this.playerSockets.get(username);
    }

    // Supprime un socket pour un joueur
    removePlayerSocket(username) {
        this.playerSockets.delete(username);
    }
}

class Game {
    constructor(roomCode, players, io, manager) {
        this.roomCode = roomCode;
        this.players = [...players]; // liste des noms de joueurs
        this.io = io; // Référence à l'instance socket.io
        this.manager = manager;

        // État du jeu
        this.isRunning = false;
        this.currentPhase = 'waiting'; // 'waiting', 'day', 'vote', 'announce', 'night'
        this.currentTurn = 0;
        this.phaseTimeLeft = 0;
        this.phaseTimer = null;
        this.playerRoles = null;

        // Nouvelles propriétés pour les sous-phases de nuit
        this.currentNightPhase = null; // 'cupidon', 'loupGarou', 'voyante', etc.
        this.currentNightOrder = 0;
        this.nightActionsCompleted = new Map(); // Stocke les actions nocturnes effectuées par rôle
        this.cupidPlayed = false; // Si Cupidon a déjà joué (une seule fois par partie)
        this.lovers = null; // Stocke les deux amoureux choisis par Cupidon

        // Durée des phases en secondes
        this.dayDuration = 30;
        this.voteDuration = 30;
        this.announceDuration = 10;
        this.nightDuration = 30;

        // Durée des différentes sous-phases de nuit en secondes
        this.cupidDuration = 30;
        this.werewolvesDuration = 30;
        this.seerDuration = 20;
        this.witchDuration = 30;
        // Ajoutez d'autres durées selon les rôles

        // Écouteurs pour les actions des joueurs
        this.actionListeners = [];

        // Gestion des votes et des morts
        this.votes = new Map();
        this.deadPlayers = [];
        this.nightVictim = null;
        this.dayVictim = null;

        this.transitioningToNight = false;

        // Données des rôles
        this.rolesData = {
            "Voyante": { camp: "Villageois", ordre: 6 },
            "Loup-Garou": { camp: "Loups-Garous", ordre: 3 },
            "Sorcière": { camp: "Villageois", ordre: 5 },
            "Cupidon": { camp: "Villageois", ordre: 1 },
            "Chasseur": { camp: "Villageois" },
            "Salvateur": { camp: "Villageois", ordre: 2 },
            "Joueur de Flûte": { camp: "Neutre", ordre: 7 },
            "Renard": { camp: "Villageois", ordre: 8 },
            "Infect Père des Loups": { camp: "Loups-Garous", ordre: 4 },
            "Ancien": { camp: "Villageois" },
            "Bouc Émissaire": { camp: "Villageois" },
            "Villageois": { camp: "Villageois" },
            "Corbeau": { camp: "Villageois", ordre: 9 }
        };
    }

    // Démarre le jeu
    async start(roleAssignments) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.currentTurn = 0;

        try {
            // Parse les assignations de rôles (JSON reçu de l'API)
            this.playerRoles = JSON.parse(roleAssignments);

            // Annonce le démarrage du jeu
            this.io.to(this.roomCode).emit('gameStarted', {
                started: true,
                roles: roleAssignments
            });

            // Message système
            this.sendSystemMessage('La partie commence !');

            // La phase de nuit ne démarre plus automatiquement ici
            // Elle sera lancée quand tous les joueurs auront confirmé qu'ils ont vu leur rôle

            return true;
        } catch (error) {
            console.error('Erreur au démarrage du jeu:', error);
            this.sendSystemMessage('Erreur lors du démarrage de la partie.');
            this.isRunning = false;
            return false;
        }
    }

    // Démarre le cycle jour/nuit
    startGameCycle() {
        // On commence par la première nuit
        this.startNightPhase();
    }

    // Démarre la phase de nuit avec ses sous-phases
    startNightPhase() {
        // Annuler le timer précédent si existant
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
        }

        // Mise à jour de l'état
        this.currentPhase = 'night';
        this.currentNightOrder = 0;
        this.nightActionsCompleted.clear();

        // Notification générale aux clients
        this.io.to(this.roomCode).emit('phaseChanged', {
            phase: 'night',
            turn: this.currentTurn
        });

        // Message système
        this.sendSystemMessage('La nuit tombe sur le village...');

        // Démarrer la première sous-phase de nuit
        this.startNextNightSubPhase();
    }

    // Méthode pour démarrer la prochaine sous-phase de nuit
    startNextNightSubPhase() {
        // Incrémenter l'ordre pour passer à la prochaine sous-phase
        this.currentNightOrder++;

        // Chercher les rôles disponibles pour l'ordre actuel
        const availableRoles = this.findAvailableRolesForCurrentOrder();

        if (availableRoles.length === 0) {
            // Si aucun rôle disponible pour cet ordre, passer au suivant
            if (this.currentNightOrder < 10) { // Limite arbitraire pour éviter les boucles infinies
                this.startNextNightSubPhase();
            } else {
                // Fin de la nuit, passer à la phase de jour
                this.startDayPhase();
            }
            return;
        }

        // Définir la sous-phase actuelle en fonction du rôle
        const currentRole = availableRoles[0].role;
        this.currentNightPhase = currentRole.toLowerCase();

        // Définir la durée en fonction du rôle
        let duration = 30; // Valeur par défaut
        if (currentRole === 'Cupidon') duration = this.cupidDuration;
        else if (currentRole === 'Loup-Garou' || currentRole === 'Infect Père des Loups') duration = this.werewolvesDuration;
        else if (currentRole === 'Voyante') duration = this.seerDuration;
        else if (currentRole === 'Sorcière') duration = this.witchDuration;

        this.phaseTimeLeft = duration;

        // Notification aux joueurs concernés
        for (const player of availableRoles) {
            // Envoyer une notification à chaque joueur du rôle courant
            this.io.to(this.roomCode).emit('nightActionRequired', {
                role: currentRole,
                player: player.pseudo,
                timeLeft: this.phaseTimeLeft
            });
        }

        // Démarrage du timer pour cette sous-phase
        this.phaseTimer = setInterval(() => {
            this.phaseTimeLeft--;

            // Envoyer une mise à jour du timer aux joueurs concernés
            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase,
                subPhase: this.currentNightPhase
            });

            // Fin de la sous-phase
            if (this.phaseTimeLeft <= 0) {
                clearInterval(this.phaseTimer);

                // Si aucune action n'a été effectuée pour cette sous-phase, gérer des actions par défaut
                this.handleDefaultNightActions();

                // Passer à la prochaine sous-phase
                this.startNextNightSubPhase();
            }
        }, 1000);
    }

    // Méthode pour trouver les rôles disponibles pour l'ordre actuel
    findAvailableRolesForCurrentOrder() {
        if (!this.playerRoles || !this.playerRoles.players) return [];

        // Cas spécial pour Cupidon (ordre 1)
        if (this.currentNightOrder === 1) {
            // Si Cupidon a déjà joué ou est absent/mort, retourner liste vide
            if (this.cupidPlayed) return [];

            const cupidon = this.playerRoles.players.find(p =>
                p.role === 'Cupidon' && !this.deadPlayers.includes(p.pseudo)
            );

            if (cupidon) {
                return [cupidon];
            }
            return [];
        }

        // Pour les autres ordres
        return this.playerRoles.players.filter(p => {
            // Trouver l'ordre du rôle
            const roleOrder = this.getRoleOrder(p.role);

            // Le joueur est vivant et son rôle correspond à l'ordre actuel
            return roleOrder === this.currentNightOrder && !this.deadPlayers.includes(p.pseudo);
        });
    }

    // Méthode pour obtenir l'ordre d'un rôle
    getRoleOrder(roleName) {
        return this.rolesData[roleName]?.ordre || 99;
    }

    // Méthode pour gérer les actions par défaut si un joueur n'a pas agi
    handleDefaultNightActions() {
        // Si on est dans la phase de Cupidon et qu'il n'a pas choisi d'amoureux
        if (this.currentNightPhase === 'cupidon' && !this.nightActionsCompleted.has('cupidon')) {
            // Ne rien faire, Cupidon a raté son tour
            this.cupidPlayed = true;
            this.sendSystemMessage("Cupidon s'est endormi et n'a pas désigné d'amoureux.");

            // Envoi de la mise à jour de phase
            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase,
                subPhase: this.currentNightPhase
            });
        }

        // Actions par défaut pour les autres rôles pourraient être ajoutées ici
    }

    // Méthode pour traiter l'action de Cupidon
    processCupidAction(cupid, lovers) {
        if (this.currentPhase !== 'night' || this.currentNightPhase !== 'cupidon') {
            return { success: false, message: "Ce n'est pas le moment pour Cupidon d'agir" };
        }

        // Vérifier que Cupidon n'a pas déjà joué
        if (this.cupidPlayed) {
            return { success: false, message: "Cupidon a déjà utilisé son pouvoir" };
        }

        // Vérifier que les amoureux sont valides (2 joueurs différents et vivants)
        if (!lovers || lovers.length !== 2 || lovers[0] === lovers[1]) {
            return { success: false, message: "Sélection d'amoureux invalide" };
        }

        if (this.deadPlayers.includes(lovers[0]) || this.deadPlayers.includes(lovers[1])) {
            return { success: false, message: "Un joueur mort ne peut pas être amoureux" };
        }

        // Enregistrer les amoureux et marquer Cupidon comme ayant joué
        this.lovers = lovers;
        this.cupidPlayed = true;

        // Informer les amoureux qu'ils sont en couple
        this.io.to(this.roomCode).emit('loversAnnounce', {
            lovers: this.lovers
        });

        // Informer Cupidon que son action a été effectuée
        this.io.to(this.roomCode).emit('cupidActionCompleted');

        // Marquer l'action comme effectuée
        this.nightActionsCompleted.set('cupidon', true);

        // Message pour Cupidon uniquement
        this.sendPrivateMessage(cupid, `Vous avez lié ${lovers[0]} et ${lovers[1]} par l'amour.`);

        // Si le timer est encore en cours, le terminer et passer à la phase suivante
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
            this.startNextNightSubPhase();
        }

        return { success: true };
    }

    // Démarre la phase de jour
    startDayPhase() {
        // Annuler le timer précédent si existant
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
        }

        this.currentPhase = 'day';
        this.phaseTimeLeft = this.dayDuration;
        this.currentTurn++; // Incrémente le compteur de tours

        // Annoncer la victime de la nuit si il y en a une
        if (this.nightVictim) {
            const victim = this.nightVictim;
            const role = this.getPlayerRole(victim);

            this.sendSystemMessage(`${victim} a été dévoré par les loups-garous cette nuit!`);
            this.sendSystemMessage(`C'était un ${role.role} du camp des ${role.camp}.`);

            // Gérer la mort du joueur (et potentiellement de son amoureux)
            this.handlePlayerDeath(victim, 'loup-garou');

            this.nightVictim = null;
        } else if (this.currentTurn > 1) { // Ne pas afficher ce message au premier tour
            this.sendSystemMessage("Personne n'a été dévoré cette nuit.");
        }

        // Notification aux clients
        this.io.to(this.roomCode).emit('phaseChanged', {
            phase: 'day',
            timeLeft: this.phaseTimeLeft,
            turn: this.currentTurn,
            deadPlayers: this.deadPlayers
        });

        this.sendSystemMessage(`Le jour se lève sur le village (Jour ${this.currentTurn})`);

        this.phaseTimer = setInterval(() => {
            this.phaseTimeLeft--;

            // Envoyer une mise à jour à chaque seconde
            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase
            });

            if (this.phaseTimeLeft <= 0) {
                clearInterval(this.phaseTimer);
                this.startVotePhase(); // Passage à la phase de vote
            }
        }, 1000);
    }

    // Nouvelle phase de vote
    startVotePhase() {
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
        }

        this.currentPhase = 'vote';
        this.phaseTimeLeft = this.voteDuration;
        this.votes.clear(); // Réinitialiser les votes

        // Notification aux clients
        this.io.to(this.roomCode).emit('phaseChanged', {
            phase: 'vote',
            timeLeft: this.phaseTimeLeft,
            turn: this.currentTurn,
            deadPlayers: this.deadPlayers
        });

        this.sendSystemMessage("Le village doit désigner un coupable! À vos votes!");

        this.phaseTimer = setInterval(() => {
            this.phaseTimeLeft--;

            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase
            });

            if (this.phaseTimeLeft <= 0) {
                clearInterval(this.phaseTimer);
                this.startAnnouncePhase(); // Passage à la phase d'annonce
            }
        }, 1000);
    }

    // Nouvelle phase d'annonce
    startAnnouncePhase() {
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
        }

        this.currentPhase = 'announce';
        this.phaseTimeLeft = this.announceDuration;

        // Compter les votes et déterminer la victime
        this.dayVictim = this.countVotes();

        if (this.dayVictim) {
            const victim = this.dayVictim;
            const role = this.getPlayerRole(victim);

            this.sendSystemMessage(`Le village a décidé d'éliminer ${victim}!`);
            this.sendSystemMessage(`C'était un ${role.role} du camp des ${role.camp}.`);

            // Gérer la mort du joueur (et potentiellement son amoureux)
            this.handlePlayerDeath(victim, 'vote');
        } else {
            this.sendSystemMessage("Le village n'a pas réussi à se mettre d'accord. Personne n'est éliminé.");
        }

        // Notification aux clients
        this.io.to(this.roomCode).emit('phaseChanged', {
            phase: 'announce',
            timeLeft: this.phaseTimeLeft,
            turn: this.currentTurn,
            victim: this.dayVictim,
            deadPlayers: this.deadPlayers
        });

        // Utiliser un simple timer pour passer à la phase suivante
        this.phaseTimer = setInterval(() => {
            this.phaseTimeLeft--;

            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase
            });

            if (this.phaseTimeLeft <= 0) {
                clearInterval(this.phaseTimer);

                // Vérifier si un joueur amoureux a été tué (l'autre mourra aussi)
                const hasLoverDeath = this.checkPendingLoverDeath();

                if (hasLoverDeath) {
                    // Si un amoureux doit mourir, on attendra l'animation
                    this.io.to(this.roomCode).emit('waitForLoverDeath', {
                        expectedDuration: 10000 // 10 secondes pour l'animation de mort d'amoureux
                    });

                    // Mais on passe quand même à la phase suivante après un délai plus long
                    setTimeout(() => {
                        this.startNightPhase();
                    }, 10000); // 10 secondes supplémentaires
                } else {
                    // Passer à la phase suivante après le délai normal
                    setTimeout(() => {
                        this.startNightPhase();
                    }, 500); // Petit délai pour l'animation
                }
            }
        }, 1000);
    }

    checkPendingLoverDeath() {
        // Si cette information est déjà stockée dans une propriété, on peut la récupérer
        // Sinon, on peut vérifier si l'un des amoureux a été tué récemment

        // Exemple de vérification (à adapter selon votre implémentation)
        if (this.lovers && this.dayVictim) {
            // Si la victime est l'un des amoureux
            if (this.lovers[0] === this.dayVictim || this.lovers[1] === this.dayVictim) {
                // L'autre amoureux va mourir de chagrin
                return true;
            }
        }

        return false;
    }


    // Méthode pour compter les votes et déterminer la victime
    countVotes() {
        if (this.votes.size === 0) return null;

        // Compter les votes pour chaque joueur
        const voteCounts = {};
        for (const [voter, votedFor] of this.votes.entries()) {
            voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
        }

        // Trouver le joueur avec le plus de votes
        let maxVotes = 0;
        let victims = [];

        for (const [player, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                victims = [player];
            } else if (count === maxVotes) {
                victims.push(player);
            }
        }

        // Vérifier s'il y a une égalité
        if (victims.length > 1) {
            this.sendSystemMessage("Égalité des votes ! Personne ne sera éliminé.");
            return null; // En cas d'égalité, personne n'est éliminé
        }

        // Si un seul joueur a le maximum de votes, il est éliminé
        return victims.length === 1 ? victims[0] : null;
    }

    // Méthode pour récupérer le rôle d'un joueur
    getPlayerRole(username) {
        if (!this.playerRoles || !this.playerRoles.players) return null;

        const playerData = this.playerRoles.players.find(
            player => player.pseudo === username
        );

        return playerData || null;
    }

    // Méthode pour traiter un vote
    processVote(voter, votedFor) {
        // Vérifier si le votant est en vie
        if (this.deadPlayers.includes(voter)) {
            return { success: false, message: "Les morts ne peuvent pas voter" };
        }

        // Vérifier si la personne votée est en vie
        if (this.deadPlayers.includes(votedFor)) {
            return { success: false, message: "Vous ne pouvez pas voter pour un mort" };
        }

        // Enregistrer le vote
        this.votes.set(voter, votedFor);

        // Informer tout le monde du vote
        this.sendSystemMessage(`${voter} a voté contre ${votedFor}`);

        // Envoyer les votes mis à jour à tous les clients
        const voteList = Array.from(this.votes.entries()).map(([voter, votedFor]) => ({
            voter,
            votedFor
        }));

        this.io.to(this.roomCode).emit('voteUpdate', {
            votes: voteList
        });

        return { success: true };
    }

    // Méthode pour gérer la mort d'un joueur et potentiellement de son amoureux
    handlePlayerDeath(player, cause = 'default') {
        if (!this.deadPlayers.includes(player)) {
            this.deadPlayers.push(player);

            // Vérifier si le joueur était amoureux
            if (this.lovers && (this.lovers[0] === player || this.lovers[1] === player)) {
                const otherLover = this.lovers[0] === player ? this.lovers[1] : this.lovers[0];

                // Si l'autre amoureux n'est pas déjà mort
                if (!this.deadPlayers.includes(otherLover)) {
                    // On stocke l'information qu'un amoureux va mourir
                    this.pendingLoverDeath = {
                        victim: player,
                        lover: otherLover,
                        loverRole: this.getPlayerRole(otherLover)
                    };

                    // Délai pour créer l'effet de suspense
                    setTimeout(() => {
                        const loverRole = this.getPlayerRole(otherLover);

                        // Message d'annonce
                        this.sendSystemMessage("Une trouble agitation parcourt le village...");

                        // Mettre à jour la liste des morts
                        this.deadPlayers.push(otherLover);

                        // Envoyer l'événement pour l'animation côté client
                        this.io.to(this.roomCode).emit('loverDeath', {
                            victim: player,
                            lover: otherLover,
                            loverRole: loverRole,
                            deadPlayers: this.deadPlayers
                        });

                        // Envoyer les messages après un court délai
                        setTimeout(() => {
                            this.sendSystemMessage(`${otherLover} meurt de chagrin suite à la perte de son amour!`);
                            this.sendSystemMessage(`C'était un ${loverRole.role} du camp des ${loverRole.camp}.`);
                        }, 1000);
                    }, 8000); // Attendre que l'animation de la première mort soit terminée
                }
            }
        }
    }

    // Envoie un message système à tous les joueurs
    sendSystemMessage(message) {
        this.io.to(this.roomCode).emit('systemMessage', message);
    }

    // Envoie un message privé à un joueur spécifique
    sendPrivateMessage(username, message) {
        const socketId = this.manager.getPlayerSocketId(username);
        if (socketId) {
            this.io.to(socketId).emit('privateMessage', {
                content: message,
                sender: 'Système'
            });
        }
    }

    // Nettoie les ressources du jeu
    cleanup() {
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
        }

        // Autres nettoyages nécessaires
        this.isRunning = false;
        this.actionListeners.forEach(listener => {
            if (listener.socket && listener.event) {
                listener.socket.off(listener.event);
            }
        });
    }

    // Récupérer l'état actuel du jeu (pour informer un client qui se reconnecte)
    getGameState() {
        return {
            isRunning: this.isRunning,
            currentPhase: this.currentPhase,
            currentNightPhase: this.currentNightPhase,
            currentTurn: this.currentTurn,
            timeLeft: this.phaseTimeLeft,
            playerRoles: this.playerRoles,
            deadPlayers: this.deadPlayers,
            lovers: this.lovers
        };
    }
}

module.exports = { GameManager, Game };