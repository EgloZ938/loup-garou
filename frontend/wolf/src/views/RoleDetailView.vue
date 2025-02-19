<template>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <!-- Animation d'entrée avec le logo -->
        <div v-if="showEntrance" class="fixed inset-0 bg-black flex items-center justify-center z-50"
            :class="{ 'opacity-0 pointer-events-none': !showEntrance }">
            <div class="text-center" :class="{ 'scale-0 opacity-0': !showEntrance }"
                style="transition: all 0.8s ease-in-out">
                <img :src="roleDetails?.icon" class="w-48 h-48 mx-auto animate-spin-slow mb-4 rounded-full" :class="{
                    'border-4 border-red-400': roleDetails?.camp === 'Loups-Garous',
                    'border-4 border-blue-400': roleDetails?.camp === 'Villageois',
                    'border-4 border-yellow-400': roleDetails?.camp === 'Neutre'
                }">
                <h2 class="text-4xl font-bold text-purple-400 animate-pulse">
                    {{ roleName }}
                </h2>
            </div>
        </div>

        <!-- Particules/étoiles en arrière-plan -->
        <div class="absolute inset-0 overflow-hidden">
            <div v-for="i in 20" :key="i" class="absolute w-1 h-1 bg-purple-400/20 rounded-full animate-twinkle" :style="{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
            }">
            </div>
        </div>

        <div class="relative max-w-5xl mx-auto p-6 min-h-screen flex flex-col">
            <!-- Bouton retour -->
            <div class="opacity-0 animate-fade-in lg:mt-12" style="animation-delay: 1.7s">
                <router-link to="/roles"
                    class="group flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors">
                    <svg class="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span class="text-lg hidden lg:inline">Retour aux rôles</span>
                </router-link>
            </div>

            <!-- Contenu principal -->
            <div class="flex-1 flex items-center">
                <div v-if="roleDetails" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Colonne de gauche : Image et infos de base -->
                    <div class="flex flex-col items-center space-y-6 opacity-0 animate-fade-in"
                        style="animation-delay: 1.7s">
                        <div class="relative">
                            <div class="absolute -inset-4 rounded-full" :class="{
                                'bg-red-500/20 animate-pulse': roleDetails.camp === 'Loups-Garous',
                                'bg-blue-500/20 animate-pulse': roleDetails.camp === 'Villageois',
                                'bg-yellow-500/20 animate-pulse': roleDetails.camp === 'Neutre'
                            }">
                            </div>
                            <img :src="roleDetails.icon" :alt="roleName"
                                class="w-48 h-48 rounded-full border-4 relative transform hover:scale-105 transition-transform duration-300"
                                :class="{
                                    'border-red-400': roleDetails.camp === 'Loups-Garous',
                                    'border-blue-400': roleDetails.camp === 'Villageois',
                                    'border-yellow-400': roleDetails.camp === 'Neutre'
                                }">
                        </div>
                        <h1 class="text-4xl font-bold mt-4 text-center" :class="{
                            'text-red-400': roleDetails.camp === 'Loups-Garous',
                            'text-blue-400': roleDetails.camp === 'Villageois',
                            'text-yellow-400': roleDetails.camp === 'Neutre'
                        }">
                            {{ roleName }}
                        </h1>
                        <div class="inline-block px-4 py-2 rounded-full" :class="{
                            'bg-red-500/10 text-red-400': roleDetails.camp === 'Loups-Garous',
                            'bg-blue-500/10 text-blue-400': roleDetails.camp === 'Villageois',
                            'bg-yellow-500/10 text-yellow-400': roleDetails.camp === 'Neutre'
                        }">
                            {{ roleDetails.camp }}
                        </div>
                        <p class="text-lg text-purple-300 text-center font-medium">
                            {{ roleDetails.description_courte }}
                        </p>
                    </div>

                    <!-- Colonne de droite : Description et caractéristiques -->
                    <div class="space-y-8 opacity-0 animate-fade-in" style="animation-delay: 2s">
                        <div class="wolf-card p-6 backdrop-blur-sm bg-purple-900/10 border border-purple-500/20">
                            <p class="text-gray-300 leading-relaxed">
                                {{ roleDetails.description_detaillee }}
                            </p>
                        </div>

                        <div class="wolf-card p-6 backdrop-blur-sm bg-purple-900/10 border border-purple-500/20">
                            <h3 class="text-xl font-bold text-purple-400 mb-6">Caractéristiques</h3>
                            <ul class="space-y-4">
                                <li class="flex items-start space-x-3 group">
                                    <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 
                    group-hover:bg-purple-500/20 transition-colors">
                                        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-purple-400 font-medium">Pouvoirs</span>
                                        <p class="text-gray-300 mt-1">{{ roleDetails.caracteristiques.pouvoirs }}</p>
                                    </div>
                                </li>
                                <li class="flex items-start space-x-3 group">
                                    <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 
                    group-hover:bg-purple-500/20 transition-colors">
                                        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-purple-400 font-medium">Actions de nuit</span>
                                        <p class="text-gray-300 mt-1">{{ roleDetails.caracteristiques.actions_de_nuit }}
                                        </p>
                                    </div>
                                </li>
                                <li class="flex items-start space-x-3 group">
                                    <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 
                    group-hover:bg-purple-500/20 transition-colors">
                                        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-purple-400 font-medium">Conditions de victoire</span>
                                        <p class="text-gray-300 mt-1">{{
                                            roleDetails.caracteristiques.conditions_de_victoire
                                            }}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { rolesDataJSON } from '@/data/rolesData';

export default {
    setup() {
        const route = useRoute();
        const showEntrance = ref(true);

        const roleName = computed(() => {
            return Object.keys(rolesDataJSON).find(
                name => name.toLowerCase() === route.params.role
            );
        });

        const roleDetails = computed(() => {
            return roleName.value ? rolesDataJSON[roleName.value] : null;
        });

        onMounted(() => {
            setTimeout(() => {
                showEntrance.value = false;
            }, 1700);
        });

        return {
            roleName,
            roleDetails,
            showEntrance
        }
    }
}
</script>

<style>
.animate-bounce-slow {
    animation: bounce 2s infinite;
}

.animate-fade-in {
    animation: fadeIn 1s forwards;
    opacity: 0;
}

.animation-delay-300 {
    animation-delay: 300ms;
}

.animate-twinkle {
    animation: twinkle 3s infinite;
}

.animate-spin-slow {
    animation: spinAndScale 1.5s ease-in-out;
}

@keyframes spinAndScale {
    0% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
    }

    50% {
        transform: scale(1.2) rotate(360deg);
        opacity: 1;
    }

    100% {
        transform: scale(1) rotate(720deg);
        opacity: 1;
    }
}


@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes twinkle {

    0%,
    100% {
        opacity: 0.2;
    }

    50% {
        opacity: 1;
    }
}
</style>