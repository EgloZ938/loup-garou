const { EventEmitter } = require('events');

class GameManager extends EventEmitter {
    constructor() {
        super();
        this.games = new Map(); // Stocke les instances de jeu par roomCode
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

        // Durée des phases en secondes
        this.dayDuration = 30;
        this.voteDuration = 30;
        this.announceDuration = 10;
        this.nightDuration = 30;

        // Écouteurs pour les actions des joueurs
        this.actionListeners = [];

        // Gestion des votes et des morts
        this.votes = new Map();
        this.deadPlayers = [];
        this.nightVictim = null;
        this.dayVictim = null;
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

    // Démarre la phase de nuit
    startNightPhase() {
        // Annuler le timer précédent si existant
        if (this.phaseTimer) {
            clearInterval(this.phaseTimer);
        }

        // Mise à jour de l'état
        this.currentPhase = 'night';
        this.phaseTimeLeft = this.nightDuration;

        // Notification aux clients
        this.io.to(this.roomCode).emit('phaseChanged', {
            phase: 'night',
            timeLeft: this.phaseTimeLeft,
            turn: this.currentTurn
        });

        // Message système
        this.sendSystemMessage('La nuit tombe sur le village...');

        // Démarrage du timer
        this.phaseTimer = setInterval(() => {
            this.phaseTimeLeft--;

            // Envoyer une mise à jour à chaque seconde
            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase
            });

            // Fin de la phase
            if (this.phaseTimeLeft <= 0) {
                clearInterval(this.phaseTimer);
                this.startDayPhase();
            }
        }, 1000);
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

            // Ajouter à la liste des morts
            this.deadPlayers.push(victim);
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

            // Ajouter à la liste des morts
            this.deadPlayers.push(victim);
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

        this.phaseTimer = setInterval(() => {
            this.phaseTimeLeft--;

            this.io.to(this.roomCode).emit('timerUpdate', {
                timeLeft: this.phaseTimeLeft,
                phase: this.currentPhase
            });

            if (this.phaseTimeLeft <= 0) {
                clearInterval(this.phaseTimer);
                this.startNightPhase(); // Passage à la phase de nuit
            }
        }, 1000);
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

        // En cas d'égalité, choisir aléatoirement (ou implémenter une règle spécifique)
        return victims.length > 0 ? victims[Math.floor(Math.random() * victims.length)] : null;
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

    // Envoie un message système à tous les joueurs
    sendSystemMessage(message) {
        this.io.to(this.roomCode).emit('systemMessage', message);
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
            currentTurn: this.currentTurn,
            timeLeft: this.phaseTimeLeft,
            playerRoles: this.playerRoles
        };
    }
}

module.exports = { GameManager, Game };