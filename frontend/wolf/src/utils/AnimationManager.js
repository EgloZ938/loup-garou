export class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.timers = new Map();
        this.listeners = new Map();
        this.durations = {
            phaseTransition: 3000,        // Transition entre les phases
            deathAnnounce: 15000,         // Animation complète d'annonce de mort
            loverDeath: 8000,             // Animation de mort d'un amoureux
            defaultStepDuration: 1500     // Durée par défaut pour les étapes d'animation
        };
    }

    // Démarre une séquence d'animation avec des étapes définies
    startSequence(animationId, stepsConfig, onComplete) {
        // Nettoyer toute animation existante avec le même ID
        this.stopAnimation(animationId);

        // Créer un nouvel objet d'animation
        const animation = {
            id: animationId,
            currentStep: 0,
            steps: stepsConfig,
            onComplete: onComplete,
            timers: []
        };

        this.animations.set(animationId, animation);

        // Exécuter les étapes séquentiellement
        let cumulativeDelay = 0;
        stepsConfig.forEach((step, index) => {
            const delay = step.delay || this.durations.defaultStepDuration;
            cumulativeDelay += delay;

            const timerId = setTimeout(() => {
                // Si l'animation a été arrêtée entre-temps, ne rien faire
                if (!this.animations.has(animationId)) return;

                // Mettre à jour l'étape actuelle
                animation.currentStep = index + 1;

                // Déclencher les callbacks d'écouteurs
                this._notifyListeners(animationId, {
                    type: 'step',
                    step: index + 1,
                    totalSteps: stepsConfig.length
                });

                // Si c'est la dernière étape, appeler le callback de fin
                if (index === stepsConfig.length - 1 && onComplete) {
                    setTimeout(() => {
                        if (this.animations.has(animationId)) {
                            onComplete();
                            this.animations.delete(animationId);
                        }
                    }, step.completionDelay || 0);
                }
            }, cumulativeDelay);

            animation.timers.push(timerId);
        });

        return animation;
    }

    // Arrête une animation en cours
    stopAnimation(animationId) {
        if (this.animations.has(animationId)) {
            const animation = this.animations.get(animationId);

            // Effacer tous les timers associés
            animation.timers.forEach(timerId => clearTimeout(timerId));

            // Supprimer l'animation
            this.animations.delete(animationId);

            // Notifier les écouteurs que l'animation a été arrêtée
            this._notifyListeners(animationId, { type: 'stopped' });

            return true;
        }
        return false;
    }

    // Ajoute un écouteur pour une animation spécifique
    addListener(animationId, callback) {
        if (!this.listeners.has(animationId)) {
            this.listeners.set(animationId, []);
        }
        this.listeners.get(animationId).push(callback);

        return () => this.removeListener(animationId, callback);
    }

    // Supprime un écouteur
    removeListener(animationId, callback) {
        if (this.listeners.has(animationId)) {
            const listeners = this.listeners.get(animationId);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    // Notifie tous les écouteurs pour une animation
    _notifyListeners(animationId, event) {
        if (this.listeners.has(animationId)) {
            this.listeners.get(animationId).forEach(callback => {
                try {
                    callback(event);
                } catch (err) {
                    console.error('Erreur dans un écouteur d\'animation:', err);
                }
            });
        }

        // Notifier également les écouteurs globaux
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                try {
                    callback({
                        ...event,
                        animationId
                    });
                } catch (err) {
                    console.error('Erreur dans un écouteur global d\'animation:', err);
                }
            });
        }
    }

    // Crée un timer contrôlé avec notification
    createTimer(timerId, duration, onTick, onComplete) {
        // Nettoyer tout timer existant avec le même ID
        this.clearTimer(timerId);

        const startTime = Date.now();
        const endTime = startTime + duration;

        // Créer l'objet de timer
        const timer = {
            id: timerId,
            duration,
            remaining: duration,
            startTime,
            endTime,
            intervalId: null,
            complete: false
        };

        // Démarrer l'intervalle de mise à jour
        timer.intervalId = setInterval(() => {
            const now = Date.now();
            timer.remaining = Math.max(0, endTime - now);

            if (onTick) {
                onTick(timer.remaining);
            }

            // Si le timer est terminé
            if (now >= endTime && !timer.complete) {
                timer.complete = true;
                timer.remaining = 0;

                clearInterval(timer.intervalId);
                this.timers.delete(timerId);

                if (onComplete) {
                    onComplete();
                }
            }
        }, 100); // Mise à jour toutes les 100ms pour une animation fluide

        this.timers.set(timerId, timer);
        return timer;
    }

    // Efface un timer
    clearTimer(timerId) {
        if (this.timers.has(timerId)) {
            const timer = this.timers.get(timerId);
            clearInterval(timer.intervalId);
            this.timers.delete(timerId);
            return true;
        }
        return false;
    }

    // Retourne l'état actuel d'une animation
    getAnimationState(animationId) {
        return this.animations.get(animationId) || null;
    }

    // Retourne l'état actuel d'un timer
    getTimerState(timerId) {
        return this.timers.get(timerId) || null;
    }
}

// Créer une instance unique pour toute l'application
export const animationManager = new AnimationManager();

// Séquence d'animation pour l'annonce de mort
export function createDeathAnnounceSequence(camp) {
    return [
        { step: 1, name: 'initial', delay: 1000 },           // Zoom sur avatar + battements
        { step: 2, name: 'atmosphere', delay: 1500 },        // Brume + grayscale
        { step: 3, name: 'announce', delay: 2000 },          // Gouttes de sang + texte
        { step: 4, name: 'impact', delay: 1500 },            // Fissures + tremblement
        { step: 5, name: 'cardAppear', delay: 2000 },        // Apparition carte de tarot
        { step: 6, name: 'cardFlip', delay: 2000 },          // Flou et début morph
        { step: 7, name: 'reveal', delay: 2000 },            // Retournement carte + couleur fond
        { step: 8, name: 'completion', delay: 3000, completionDelay: 1000 }  // Timer et pause finale
    ];
}

// Séquence d'animation pour la mort d'un amoureux
export function createLoverDeathSequence() {
    return [
        { step: 1, name: 'heartbreak', delay: 1500 },        // Cœur qui se brise
        { step: 2, name: 'roleReveal', delay: 1500 },        // Révélation du rôle
        { step: 3, name: 'completion', delay: 5000, completionDelay: 5000 }  // Timer final avec délai explicite
    ];
}