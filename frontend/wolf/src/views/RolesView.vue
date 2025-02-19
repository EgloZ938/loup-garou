<template>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        <!-- Particules/étoiles en arrière-plan -->
        <div class="absolute inset-0 overflow-hidden">
            <div v-for="i in 20" :key="i" class="absolute w-1 h-1 bg-purple-400/20 rounded-full animate-twinkle" :style="{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
            }">
            </div>
        </div>

        <div class="max-w-6xl mx-auto p-6 relative">
            <!-- Bouton retour -->
            <div class="opacity-0 animate-fade-in mb-12">
                <router-link to="/"
                    class="group flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors">
                    <svg class="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span class="text-lg hidden lg:inline">Retour à l'accueil</span>
                </router-link>
            </div>

            <h2 class="text-4xl font-bold text-center text-purple-400 mb-12 opacity-0 animate-fade-in">
                Les Rôles du Loup-Garou
            </h2>

            <!-- Sélecteurs de filtres -->
            <div class="flex flex-wrap gap-4 mb-8 justify-center opacity-0 animate-fade-in animation-delay-200">
                <button @click="currentFilter = 'all'" class="px-4 py-2 rounded-full transition-colors" :class="currentFilter === 'all'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'">
                    Tous les rôles
                </button>
                <button @click="currentFilter = 'Villageois'" class="px-4 py-2 rounded-full transition-colors" :class="currentFilter === 'Villageois'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'">
                    Villageois
                </button>
                <button @click="currentFilter = 'Loups-Garous'" class="px-4 py-2 rounded-full transition-colors" :class="currentFilter === 'Loups-Garous'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'">
                    Loups-Garous
                </button>
                <button @click="currentFilter = 'Neutre'" class="px-4 py-2 rounded-full transition-colors" :class="currentFilter === 'Neutre'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'">
                    Neutres
                </button>
            </div>

            <!-- Grille des rôles -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <router-link v-for="(role, name, index) in filteredRoles" :key="name"
                    :to="`/roles/${name.toLowerCase()}`" class="group relative overflow-hidden rounded-xl backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 
                        hover:bg-purple-900/20 transition-all duration-300 hover:scale-105 opacity-0 animate-fade-in"
                    :style="{ animationDelay: `${index * 100}ms` }">
                    <!-- Effet de brillance au hover -->
                    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="absolute inset-0" :class="{
                            'bg-red-500/5': role.camp === 'Loups-Garous',
                            'bg-blue-500/5': role.camp === 'Villageois',
                            'bg-yellow-500/5': role.camp === 'Neutre'
                        }"></div>
                    </div>

                    <div class="p-6 text-center space-y-4 relative z-10">
                        <div class="relative inline-block">
                            <div class="absolute -inset-2 rounded-full opacity-50" :class="{
                                'bg-red-500/20 group-hover:animate-pulse': role.camp === 'Loups-Garous',
                                'bg-blue-500/20 group-hover:animate-pulse': role.camp === 'Villageois',
                                'bg-yellow-500/20 group-hover:animate-pulse': role.camp === 'Neutre'
                            }"></div>
                            <img :src="role.icon" :alt="name"
                                class="w-24 h-24 mx-auto rounded-full border-2 relative transform group-hover:scale-110 transition-transform duration-300"
                                :class="{
                                    'border-red-400': role.camp === 'Loups-Garous',
                                    'border-blue-400': role.camp === 'Villageois',
                                    'border-yellow-400': role.camp === 'Neutre'
                                }">
                        </div>
                        <h3 class="font-bold text-lg group-hover:scale-105 transition-transform" :class="{
                            'text-red-400': role.camp === 'Loups-Garous',
                            'text-blue-400': role.camp === 'Villageois',
                            'text-yellow-400': role.camp === 'Neutre'
                        }">{{ name }}</h3>
                        <p class="text-gray-400 text-sm line-clamp-2 group-hover:text-gray-300 transition-colors">
                            {{ role.description_courte }}
                        </p>
                    </div>
                </router-link>
            </div>

            <!-- Message si aucun rôle trouvé -->
            <div v-if="filteredRoles.length === 0" class="text-center text-gray-400 py-12 opacity-0 animate-fade-in">
                Aucun rôle trouvé pour ce camp
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
import { rolesDataJSON } from '@/data/rolesData';

export default {
    setup() {
        const currentFilter = ref('all');

        const filteredRoles = computed(() => {
            if (currentFilter.value === 'all') {
                return rolesDataJSON;
            }

            return Object.entries(rolesDataJSON)
                .filter(([_, role]) => role.camp === currentFilter.value)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
        });

        return {
            currentFilter,
            filteredRoles
        }
    }
}
</script>

<style>
.animate-fade-in {
    animation: fadeIn 1s forwards;
    opacity: 0;
}

.animation-delay-200 {
    animation-delay: 200ms;
}

.animate-twinkle {
    animation: twinkle 3s infinite;
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

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>