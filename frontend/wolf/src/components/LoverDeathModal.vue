<template>
    <div v-if="show" class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div class="text-center max-w-xl">
            <div class="space-y-8 transform transition-all duration-700 ease-out opacity-0 translate-y-10"
                :class="{ 'opacity-100 translate-y-0': animationStarted }">
                <h2 class="text-5xl font-bold text-pink-400 mb-6">Mort par chagrin</h2>

                <!-- Animation du coeur brisé -->
                <div class="relative mx-auto w-40 h-40 mb-4">
                    <img :src="avatar || '/assets/avatar_default2.png'" :alt="victim"
                        class="w-40 h-40 rounded-full border-4 border-pink-400 opacity-80 transition-all duration-500"
                        :class="{ 'grayscale': showHeartbreak }">

                    <!-- Coeur brisé -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <img src="/assets/coeur_rose.png" alt="Coeur brisé"
                            class="w-32 h-32 transition-all duration-3000"
                            :class="{ 'animate-heartbreak': showHeartbreak }">
                    </div>
                </div>

                <!-- Nom de l'amoureux -->
                <div class="text-4xl font-bold text-gray-300">
                    {{ victim }} est mort(e) de chagrin!
                </div>

                <!-- Révélation du rôle -->
                <transition enter-active-class="transition duration-1000 transform"
                    enter-from-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100" appear>
                    <div v-if="showRole" class="mt-10 space-y-4">
                        <!-- Titre de la révélation -->
                        <h3 class="text-2xl text-gray-400 mb-2">Révélation du rôle</h3>

                        <!-- Icône du rôle -->
                        <div v-if="roleDetails" class="relative inline-block mb-2">
                            <div class="absolute -inset-2 rounded-full opacity-50" :class="{
                                'bg-red-500/20 animate-pulse': role?.camp === 'Loups-Garous',
                                'bg-blue-500/20 animate-pulse': role?.camp === 'Villageois',
                                'bg-yellow-500/20 animate-pulse': role?.camp === 'Neutre'
                            }"></div>
                            <img :src="roleDetails.icon" :alt="role?.role"
                                class="w-24 h-24 mx-auto rounded-full border-4 relative" :class="{
                                    'border-red-400': role?.camp === 'Loups-Garous',
                                    'border-blue-400': role?.camp === 'Villageois',
                                    'border-yellow-400': role?.camp === 'Neutre'
                                }">
                        </div>

                        <!-- Nom du rôle avec animation de texte -->
                        <div class="text-3xl font-bold animate-pulse" :class="{
                            'text-red-400': role?.camp === 'Loups-Garous',
                            'text-blue-400': role?.camp === 'Villageois',
                            'text-yellow-400': role?.camp === 'Neutre'
                        }">
                            {{ role?.role }}
                        </div>

                        <!-- Camp du joueur -->
                        <div class="mt-2 px-6 py-2 rounded-full inline-block" :class="{
                            'bg-red-500/10 text-red-400': role?.camp === 'Loups-Garous',
                            'bg-blue-500/10 text-blue-400': role?.camp === 'Villageois',
                            'bg-yellow-500/10 text-yellow-400': role?.camp === 'Neutre'
                        }">
                            {{ role?.camp }}
                        </div>
                    </div>
                </transition>

                <!-- Timer pour fermeture automatique -->
                <div v-if="autoCloseTimer > 0" class="mt-8 text-gray-400 text-sm">
                    Ce message se fermera dans {{ autoCloseTimer }}s
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';

export default {
    name: 'LoverDeathModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        victim: {
            type: String,
            default: ''
        },
        role: {
            type: Object,
            default: null
        },
        roleDetails: {
            type: Object,
            default: null
        },
        avatar: {
            type: String,
            default: ''
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const showHeartbreak = ref(false);
        const showRole = ref(false);
        const animationStarted = ref(false);
        const autoCloseTimer = ref(0);
        let timerInterval = null;

        // Lancement séquentiel des animations
        const startAnimations = () => {
            // Animation d'entrée
            animationStarted.value = true;

            // Après un délai, montrer l'animation du cœur brisé
            setTimeout(() => {
                showHeartbreak.value = true;

                // Après un autre délai, montrer le rôle
                setTimeout(() => {
                    showRole.value = true;

                    // Démarrer le timer de fermeture automatique
                    autoCloseTimer.value = 10;
                    timerInterval = setInterval(() => {
                        autoCloseTimer.value--;
                        if (autoCloseTimer.value <= 0) {
                            clearInterval(timerInterval);
                            emit('close');
                        }
                    }, 1000);
                }, 2500);
            }, 1500);
        };

        // Réinitialiser les animations quand le modal se ferme
        const resetAnimations = () => {
            showHeartbreak.value = false;
            showRole.value = false;
            animationStarted.value = false;
            autoCloseTimer.value = 0;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        };

        // Observer les changements de visibilité
        watch(() => props.show, (isVisible) => {
            if (isVisible) {
                startAnimations();
            } else {
                resetAnimations();
            }
        });

        // Lancer les animations au montage si déjà visible
        onMounted(() => {
            if (props.show) {
                startAnimations();
            }
        });

        // Nettoyer les timers au démontage
        onUnmounted(() => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        });

        return {
            showHeartbreak,
            showRole,
            animationStarted,
            autoCloseTimer
        };
    }
};
</script>

<style scoped>
/* Animation du cœur qui se brise */
@keyframes heartbreak {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    20% {
        transform: scale(1.3);
        filter: saturate(1.5);
    }

    40% {
        transform: scale(1) rotate(15deg);
        filter: saturate(1);
    }

    60% {
        transform: scale(0.8) rotate(-15deg);
        filter: saturate(0.8);
    }

    80% {
        transform: scale(0.6) rotate(0);
        opacity: 0.7;
        filter: saturate(0.5);
    }

    100% {
        transform: scale(0.5);
        opacity: 0;
        filter: saturate(0);
    }
}

.animate-heartbreak {
    animation: heartbreak 3s forwards;
}

/* Animation de pulsation */
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
</style>