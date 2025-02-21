<template>
    <div v-if="show" class="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        @click="closeWithAnimation">
        <!-- Container principal -->
        <div class="relative max-w-5xl mx-auto p-6 min-h-[80vh] flex flex-col" @click.stop>
            <!-- Particules/étoiles en arrière-plan -->
            <div class="absolute inset-0 overflow-hidden">
                <div v-for="i in 20" :key="i" class="absolute w-1 h-1 bg-purple-400/20 rounded-full animate-twinkle"
                    :style="{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`
                    }">
                </div>
            </div>

            <!-- Bouton de fermeture -->
            <button @click="closeWithAnimation"
                class="absolute top-4 right-4 text-gray-400 hover:text-white p-2 transition-colors z-10">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <!-- Contenu principal -->
            <div class="flex-1 flex items-center">
                <div v-if="role" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Colonne de gauche : Image et infos de base -->
                    <div class="flex flex-col items-center space-y-6"
                        :class="[isLeaving ? 'animate-fade-out' : 'animate-fade-in']" style="animation-delay: 200ms">
                        <div class="relative">
                            <div class="absolute -inset-4 rounded-full" :class="{
                                'bg-red-500/20 animate-pulse': role.camp === 'Loups-Garous',
                                'bg-blue-500/20 animate-pulse': role.camp === 'Villageois',
                                'bg-yellow-500/20 animate-pulse': role.camp === 'Neutre'
                            }">
                            </div>
                            <img :src="role.icon" :alt="roleName"
                                class="w-48 h-48 rounded-full border-4 relative transform hover:scale-105 transition-transform duration-300"
                                :class="{
                                    'border-red-400': role.camp === 'Loups-Garous',
                                    'border-blue-400': role.camp === 'Villageois',
                                    'border-yellow-400': role.camp === 'Neutre'
                                }">
                        </div>
                        <h1 class="text-4xl font-bold mt-4 text-center" :class="{
                            'text-red-400': role.camp === 'Loups-Garous',
                            'text-blue-400': role.camp === 'Villageois',
                            'text-yellow-400': role.camp === 'Neutre'
                        }">
                            {{ roleName }}
                        </h1>
                        <div class="inline-block px-4 py-2 rounded-full" :class="{
                            'bg-red-500/10 text-red-400': role.camp === 'Loups-Garous',
                            'bg-blue-500/10 text-blue-400': role.camp === 'Villageois',
                            'bg-yellow-500/10 text-yellow-400': role.camp === 'Neutre'
                        }">
                            {{ role.camp }}
                        </div>
                        <p class="text-lg text-purple-300 text-center font-medium">
                            {{ role.description_courte }}
                        </p>
                    </div>

                    <!-- Colonne de droite : Description et caractéristiques -->
                    <div class="space-y-8" :class="[isLeaving ? 'animate-fade-out' : 'animate-fade-in']"
                        style="animation-delay: 400ms">
                        <div class="wolf-card p-6 backdrop-blur-sm bg-purple-900/10 border border-purple-500/20">
                            <p class="text-gray-300 leading-relaxed">
                                {{ role.description_detaillee }}
                            </p>
                        </div>

                        <div class="wolf-card p-6 backdrop-blur-sm bg-purple-900/10 border border-purple-500/20">
                            <h3 class="text-xl font-bold text-purple-400 mb-6">Caractéristiques</h3>
                            <ul class="space-y-4">
                                <li class="flex items-start space-x-3 group">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-purple-400 font-medium">Pouvoirs</span>
                                        <p class="text-gray-300 mt-1">{{ role.caracteristiques.pouvoirs }}</p>
                                    </div>
                                </li>
                                <li class="flex items-start space-x-3 group">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-purple-400 font-medium">Actions de nuit</span>
                                        <p class="text-gray-300 mt-1">{{ role.caracteristiques.actions_de_nuit }}</p>
                                    </div>
                                </li>
                                <li class="flex items-start space-x-3 group">
                                    <div
                                        class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                        <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-purple-400 font-medium">Conditions de victoire</span>
                                        <p class="text-gray-300 mt-1">{{ role.caracteristiques.conditions_de_victoire }}
                                        </p>
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
export default {
    props: {
        show: {
            type: Boolean,
            default: false
        },
        roleName: {
            type: String,
            required: true
        },
        role: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isLeaving: false
        }
    },
    methods: {
        closeWithAnimation() {
            this.isLeaving = true;
            setTimeout(() => {
                this.isLeaving = false;
                this.$emit('close');
            }, 550);
        }
    },
    emits: ['close']
}
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s forwards;
    opacity: 0;
}

.animate-fade-out {
    animation: fadeOut 0.55s ease-out forwards;
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

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }

    to {
        opacity: 0;
        transform: translateY(-20px);
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