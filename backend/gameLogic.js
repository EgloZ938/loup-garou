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
        this.currentPhase = 'waiting'; // 'waiting', 'day', 'night'
        this.currentTurn = 0;
        this.phaseTimeLeft = 0;
        this.phaseTimer = null;
        this.playerRoles = null; // Sera défini lors de l'assignation des rôles

        // Durée des phases en secondes
        this.dayDuration = 30;
        this.nightDuration = 30;

        // Écouteurs pour les actions des joueurs
        this.actionListeners = [];
    }

    // Démarre le jeu
    async start(roleAssignments) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.currentTurn = 0;

        try {
            // Parse les assignations de rôles (JSON reçu de l'API OpenAI)
            this.playerRoles = JSON.parse(roleAssignments);

            // Annonce le démarrage du jeu
            this.io.to(this.roomCode).emit('gameStarted', {
                started: true,
                roles: roleAssignments
            });

            // Message système
            this.sendSystemMessage('La partie commence !');

            // Attendre 6 secondes pour laisser les joueurs voir leurs rôles
            setTimeout(() => {
                this.startGameCycle();
            }, 6000);

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

        // Mise à jour de l'état
        this.currentPhase = 'day';
        this.phaseTimeLeft = this.dayDuration;
        this.currentTurn++; // Incrémente le compteur de tours

        // Notification aux clients
        this.io.to(this.roomCode).emit('phaseChanged', {
            phase: 'day',
            timeLeft: this.phaseTimeLeft,
            turn: this.currentTurn
        });

        // Message système
        this.sendSystemMessage(`Le jour se lève sur le village (Jour ${this.currentTurn})`);

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
                this.startNightPhase();
            }
        }, 1000);
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