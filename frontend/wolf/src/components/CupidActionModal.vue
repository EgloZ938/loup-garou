<template>
    <div v-if="show" class="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div
            class="max-w-4xl w-full bg-purple-900/10 backdrop-blur-lg border border-purple-500/30 rounded-xl p-8 relative">
            <!-- Titre et description -->
            <div class="text-center mb-8">
                <img src="/assets/cupidon.png" alt="Cupidon"
                    class="w-24 h-24 mx-auto mb-4 border-4 border-pink-400 rounded-full animate-pulse">
                <h2 class="text-3xl font-bold text-pink-400 mb-2">Cupidon</h2>
                <p class="text-gray-300">Choisissez deux joueurs pour les lier par l'amour.</p>
                <p class="text-gray-400 text-sm mt-4">Si l'un meurt, l'autre mourra de chagrin.</p>

                <div class="mt-4 text-pink-300">
                    <span>Temps restant: {{ timeLeft }}s</span>
                </div>
            </div>

            <!-- Cercle de joueurs -->
            <div ref="playersContainer" class="relative mb-8" style="height: 360px;">
                <!-- Lignes d'amour (dessinées en CSS) -->
                <div v-if="selectedLovers.length === 2 && loversRefs.length === 2"
                    class="absolute z-0 pointer-events-none">
                    <!-- Première flèche -->
                    <div class="love-arrow" :style="getArrowStyles(0, 1)">
                        <div class="arrow-head"></div>
                    </div>
                    <!-- Deuxième flèche (inverse) -->
                    <div class="love-arrow" :style="getArrowStyles(1, 0)">
                        <div class="arrow-head"></div>
                    </div>
                    <!-- Cœur au milieu -->
                    <div class="absolute" :style="getHeartStyles()">
                        <img src="/assets/coeur_rose.png" alt="Cœur" class="w-24 h-24 animate-pulse">
                    </div>
                </div>

                <!-- Joueurs positionnés en cercle -->
                <div v-for="(user, index) in availablePlayers" :key="user"
                    class="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300" :style="{
                        top: `${50 + 40 * Math.sin(2 * Math.PI * index / availablePlayers.length)}%`,
                        left: `${50 + 40 * Math.cos(2 * Math.PI * index / availablePlayers.length)}%`,
                    }"
                    :ref="el => { if (selectedLovers.includes(user)) loversRefs[selectedLovers.indexOf(user)] = el; }">
                    <div class="cursor-pointer transition-transform duration-300 hover:scale-110"
                        @click="toggleLover(user)">
                        <div class="relative">
                            <img src="/assets/avatar_default2.png" alt="Avatar"
                                class="w-16 h-16 rounded-full transition-all duration-300" :class="{
                                    'border-4 border-pink-400 shadow-lg shadow-pink-500/50': selectedLovers.includes(user),
                                    'border-2 border-gray-500/50': !selectedLovers.includes(user)
                                }">

                            <!-- Badge indiquant l'ordre de sélection -->
                            <div v-if="selectedLovers.includes(user)"
                                class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                                {{ selectedLovers.indexOf(user) + 1 }}
                            </div>
                        </div>

                        <div class="mt-2 text-center text-sm font-medium" :class="{
                            'text-pink-300': selectedLovers.includes(user),
                            'text-gray-300': !selectedLovers.includes(user)
                        }">
                            {{ user }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Message de notification -->
            <div v-if="notification" class="text-center mb-6">
                <div class="px-4 py-2 rounded-lg inline-block" :class="{
                    'bg-red-500/10 text-red-400': notificationType === 'error',
                    'bg-green-500/10 text-green-400': notificationType === 'success'
                }">
                    {{ notification }}
                </div>
            </div>

            <!-- Boutons d'action -->
            <div class="flex justify-center gap-4">
                <button @click="confirmLovers"
                    class="px-6 py-3 rounded-full font-semibold transition-all hover:scale-105" :class="{
                        'bg-pink-500/30 text-pink-200 cursor-not-allowed': selectedLovers.length !== 2,
                        'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30': selectedLovers.length === 2
                    }" :disabled="selectedLovers.length !== 2">
                    Confirmer
                </button>
                <button @click="resetLovers"
                    class="px-6 py-3 bg-gray-700/20 text-gray-300 rounded-full transition-all hover:bg-gray-700/30 hover:scale-105">
                    Réinitialiser
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export default {
    name: 'CupidActionModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        players: {
            type: Array,
            required: true
        },
        deadPlayers: {
            type: Array,
            default: () => []
        },
        currentUsername: {
            type: String,
            required: true
        },
        timeLeft: {
            type: Number,
            default: 30
        }
    },
    emits: ['submit', 'close'],
    setup(props, { emit }) {
        const selectedLovers = ref([]);
        const notification = ref('');
        const notificationType = ref('');
        const playersContainer = ref(null);
        const loversRefs = ref([null, null]);
        let autoCloseTimer = null;

        // Filtrer les joueurs disponibles (vivants)
        const availablePlayers = computed(() => {
            return props.players.filter(player => !props.deadPlayers.includes(player));
        });

        // Fonction pour réagir aux changements du temps restant
        watch(() => props.timeLeft, (newTime) => {
            if (newTime <= 0) {
                // Si le temps est écoulé, fermer le modal
                emit('close');
            }
        });

        // Réinitialiser la sélection quand le modal s'ouvre/ferme
        watch(() => props.show, (isVisible) => {
            if (isVisible) {
                selectedLovers.value = [];
                notification.value = '';

                // Mettre en place un timer de fermeture automatique
                if (autoCloseTimer) clearTimeout(autoCloseTimer);
                autoCloseTimer = setTimeout(() => {
                    emit('close');
                }, props.timeLeft * 1000);
            } else {
                // Nettoyer le timer si le modal est fermé
                if (autoCloseTimer) {
                    clearTimeout(autoCloseTimer);
                    autoCloseTimer = null;
                }
            }
        });

        // Nettoyer le timer en quittant le composant
        onUnmounted(() => {
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
        });

        // Fonction pour obtenir le style de la flèche entre deux amoureux
        const getArrowStyles = (fromIndex, toIndex) => {
            if (!loversRefs.value[fromIndex] || !loversRefs.value[toIndex]) return {};

            const fromRect = loversRefs.value[fromIndex].getBoundingClientRect();
            const toRect = loversRefs.value[toIndex].getBoundingClientRect();
            const containerRect = playersContainer.value.getBoundingClientRect();

            // Calculer les positions relatives au conteneur
            const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
            const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
            const toX = toRect.left + toRect.width / 2 - containerRect.left;
            const toY = toRect.top + toRect.height / 2 - containerRect.top;

            // Calculer l'angle et la longueur
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);

            return {
                width: `${length * 0.7}px`,  // Réduire un peu pour ne pas toucher l'avatar
                left: `${fromX}px`,
                top: `${fromY}px`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'left center'
            };
        };

        // Fonction pour positionner le cœur au milieu
        const getHeartStyles = () => {
            if (!loversRefs.value[0] || !loversRefs.value[1]) return {};

            const firstRect = loversRefs.value[0].getBoundingClientRect();
            const secondRect = loversRefs.value[1].getBoundingClientRect();
            const containerRect = playersContainer.value.getBoundingClientRect();

            const firstX = firstRect.left + firstRect.width / 2 - containerRect.left;
            const firstY = firstRect.top + firstRect.height / 2 - containerRect.top;
            const secondX = secondRect.left + secondRect.width / 2 - containerRect.left;
            const secondY = secondRect.top + secondRect.height / 2 - containerRect.top;

            // Ajustement pour un cœur plus grand (24x24)
            return {
                left: `${(firstX + secondX) / 2 - 12}px`, // -12 pour centrer l'image de 24px
                top: `${(firstY + secondY) / 2 - 12}px`,
                zIndex: '10' // S'assurer que le cœur est au-dessus des flèches
            };
        }

        // Fonction pour sélectionner/désélectionner un amoureux
        const toggleLover = (user) => {
            // Vérifier si le joueur est déjà sélectionné
            if (selectedLovers.value.includes(user)) {
                // Le retirer de la sélection
                selectedLovers.value = selectedLovers.value.filter(selected => selected !== user);
                notification.value = '';
            } else {
                // Vérifier si on a déjà sélectionné 2 joueurs
                if (selectedLovers.value.length >= 2) {
                    notification.value = 'Vous ne pouvez sélectionner que 2 joueurs';
                    notificationType.value = 'error';
                    return;
                }

                // Ajouter le joueur à la sélection
                selectedLovers.value.push(user);

                // Afficher un message si 2 joueurs sont sélectionnés
                if (selectedLovers.value.length === 2) {
                    notification.value = 'Amoureux sélectionnés ! Confirmez votre choix';
                    notificationType.value = 'success';
                }
            }

            // Réinitialiser les références pour les recalculer
            loversRefs.value = [null, null];
        };

        // Fonction pour réinitialiser la sélection
        const resetLovers = () => {
            selectedLovers.value = [];
            notification.value = '';
            loversRefs.value = [null, null];
        };

        // Fonction pour confirmer la sélection
        const confirmLovers = () => {
            if (selectedLovers.value.length !== 2) {
                notification.value = 'Vous devez sélectionner exactement 2 joueurs';
                notificationType.value = 'error';
                return;
            }

            emit('submit', selectedLovers.value);
        };

        return {
            selectedLovers,
            availablePlayers,
            notification,
            notificationType,
            playersContainer,
            loversRefs,
            toggleLover,
            resetLovers,
            confirmLovers,
            getArrowStyles,
            getHeartStyles
        };
    }
};
</script>

<style scoped>
/* Animation de pulsation pour les amoureux sélectionnés */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Style pour les flèches d'amour */
.love-arrow {
    position: absolute;
    height: 2px;
    background-color: #ec4899;
    background-image: linear-gradient(90deg, #ec4899 50%, transparent 50%);
    background-size: 10px 1px;
    background-repeat: repeat-x;
}

.arrow-head {
    position: absolute;
    right: -8px;
    top: -4px;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-left: 8px solid #ec4899;
    border-bottom: 5px solid transparent;
}
</style>