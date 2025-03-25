<template>
    <div v-if="show" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 w-full max-w-4xl p-6 rounded-xl">
            <!-- En-tête -->
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-purple-400">Configuration de la partie</h2>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-200">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Options de configuration -->
            <div class="mb-8">
                <div class="flex space-x-4">
                    <button @click="activeTab = 'auto'"
                        class="flex-1 py-3 px-4 rounded-lg transition-all duration-300 flex flex-col items-center"
                        :class="activeTab === 'auto' ? 'bg-purple-800/40 border border-purple-500/50' : 'bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/30'">
                        <svg class="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none"
                            :stroke="activeTab === 'auto' ? 'currentColor' : 'currentColor'"
                            :class="activeTab === 'auto' ? 'text-purple-400' : 'text-gray-400'">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span class="text-lg font-semibold"
                            :class="activeTab === 'auto' ? 'text-purple-400' : 'text-gray-400'">Équilibrage
                            automatique</span>
                        <span class="text-sm text-gray-500 text-center mt-1">L'algorithme choisit une répartition
                            équilibrée des rôles</span>
                    </button>

                    <button @click="activeTab = 'manual'"
                        class="flex-1 py-3 px-4 rounded-lg transition-all duration-300 flex flex-col items-center"
                        :class="activeTab === 'manual' ? 'bg-purple-800/40 border border-purple-500/50' : 'bg-gray-800/20 border border-gray-700/30 hover:bg-gray-800/30'">
                        <svg class="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none"
                            :stroke="activeTab === 'manual' ? 'currentColor' : 'currentColor'"
                            :class="activeTab === 'manual' ? 'text-purple-400' : 'text-gray-400'">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="text-lg font-semibold"
                            :class="activeTab === 'manual' ? 'text-purple-400' : 'text-gray-400'">Configuration
                            manuelle</span>
                        <span class="text-sm text-gray-500 text-center mt-1">Choisissez vous-même les rôles et leur
                            nombre</span>
                    </button>
                </div>
            </div>

            <!-- Contenu basé sur l'onglet actif -->
            <div v-if="activeTab === 'auto'" class="mb-8">
                <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold text-purple-400 mb-2">Distribution des rôles automatique</h3>
                    <p class="text-gray-300">L'algorithme attribuera automatiquement les rôles pour une expérience de
                        jeu équilibrée basée sur le nombre de joueurs.</p>

                    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                            <div class="flex items-center">
                                <img src="/assets/loup-garou.png" alt="Loups-Garous"
                                    class="w-10 h-10 rounded-full border border-red-500 mr-3">
                                <div>
                                    <p class="text-red-400 font-semibold">Camp des Loups-Garous</p>
                                    <p class="text-gray-400 text-sm">~30% des joueurs</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                            <div class="flex items-center">
                                <img src="/assets/voyante.png" alt="Voyante"
                                    class="w-10 h-10 rounded-full border border-blue-500 mr-3">
                                <div>
                                    <p class="text-blue-400 font-semibold">Voyante</p>
                                    <p class="text-gray-400 text-sm">Toujours présente</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                            <div class="flex items-center">
                                <img src="/assets/sorciere.png" alt="Sorcière"
                                    class="w-10 h-10 rounded-full border border-blue-500 mr-3">
                                <div>
                                    <p class="text-blue-400 font-semibold">Sorcière</p>
                                    <p class="text-gray-400 text-sm">Toujours présente</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                            <div class="flex items-center">
                                <img src="/assets/villageois.png" alt="Villageois"
                                    class="w-10 h-10 rounded-full border border-blue-500 mr-3">
                                <div>
                                    <p class="text-blue-400 font-semibold">Autres rôles</p>
                                    <p class="text-gray-400 text-sm">Distribution optimale</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="activeTab === 'manual'" class="mb-8">
                <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 p-4 rounded-lg mb-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-purple-400">Sélection des rôles</h3>
                        <div class="text-gray-300">
                            <span class="text-xl font-bold">{{ totalPlayers }}</span> / <span class="text-gray-500">{{
                                playerCount }}</span>
                            <span class="ml-2 px-3 py-1 rounded-md text-sm"
                                :class="isBalanced ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'">
                                {{ isBalanced ? 'Équilibré' : 'Déséquilibré' }}
                            </span>
                        </div>
                    </div>

                    <!-- Règles d'équilibrage -->
                    <div class="mb-4 text-sm bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
                        <p class="text-gray-400">
                            <span class="text-yellow-400">Recommandations : </span>
                            <span class="text-red-400">Loups-Garous (~30%)</span> -
                            <span class="text-blue-400">Villageois (~70%)</span> -
                            Inclure au moins la Voyante et la Sorcière pour l'équilibre.
                        </p>
                    </div>

                    <!-- Sélecteurs de rôles -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 max-h-[300px] overflow-y-auto pr-2">
                        <!-- Camp des Loups-Garous -->
                        <div v-for="role in werewolfRoles" :key="role.name"
                            class="bg-gray-800/30 border border-red-900/40 rounded-lg p-3">
                            <div class="flex items-center mb-2">
                                <img :src="role.icon" :alt="role.name"
                                    class="w-10 h-10 rounded-full border border-red-500 mr-3">
                                <div class="flex-1">
                                    <p class="text-red-400 font-semibold">{{ role.name }}</p>
                                    <p class="text-gray-500 text-xs">{{ role.description_courte }}</p>
                                </div>
                            </div>
                            <div class="flex justify-end items-center mt-2">
                                <button @click="decrementRole(role)"
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 transition-colors"
                                    :disabled="role.count <= 0">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M20 12H4" />
                                    </svg>
                                </button>
                                <span class="w-8 text-center text-gray-300 font-semibold">{{ role.count }}</span>
                                <button @click="incrementRole(role)"
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 transition-colors"
                                    :disabled="totalPlayers >= playerCount">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Camp des Villageois -->
                        <div v-for="role in villagerRoles" :key="role.name"
                            class="bg-gray-800/30 border border-blue-900/40 rounded-lg p-3">
                            <div class="flex items-center mb-2">
                                <img :src="role.icon" :alt="role.name"
                                    class="w-10 h-10 rounded-full border border-blue-500 mr-3">
                                <div class="flex-1">
                                    <p class="text-blue-400 font-semibold">{{ role.name }}</p>
                                    <p class="text-gray-500 text-xs">{{ role.description_courte }}</p>
                                </div>
                            </div>
                            <div class="flex justify-end items-center mt-2">
                                <button @click="decrementRole(role)"
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 transition-colors"
                                    :disabled="role.count <= 0">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M20 12H4" />
                                    </svg>
                                </button>
                                <span class="w-8 text-center text-gray-300 font-semibold">{{ role.count }}</span>
                                <button @click="incrementRole(role)"
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 transition-colors"
                                    :disabled="totalPlayers >= playerCount">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Camp Neutre -->
                        <div v-for="role in neutralRoles" :key="role.name"
                            class="bg-gray-800/30 border border-yellow-900/40 rounded-lg p-3">
                            <div class="flex items-center mb-2">
                                <img :src="role.icon" :alt="role.name"
                                    class="w-10 h-10 rounded-full border border-yellow-500 mr-3">
                                <div class="flex-1">
                                    <p class="text-yellow-400 font-semibold">{{ role.name }}</p>
                                    <p class="text-gray-500 text-xs">{{ role.description_courte }}</p>
                                </div>
                            </div>
                            <div class="flex justify-end items-center mt-2">
                                <button @click="decrementRole(role)"
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 transition-colors"
                                    :disabled="role.count <= 0">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M20 12H4" />
                                    </svg>
                                </button>
                                <span class="w-8 text-center text-gray-300 font-semibold">{{ role.count }}</span>
                                <button @click="incrementRole(role)"
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/70 text-gray-400 hover:bg-gray-700/70 transition-colors"
                                    :disabled="totalPlayers >= playerCount">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Boutons d'action -->
            <div class="flex justify-end space-x-4">
                <button @click="$emit('close')"
                    class="px-5 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50 transition-colors">
                    Annuler
                </button>
                <button @click="startGame" class="wolf-button-primary hover:scale-105 transition-transform duration-300"
                    :disabled="activeTab === 'manual' && totalPlayers !== playerCount"
                    :class="{ 'opacity-50 cursor-not-allowed': activeTab === 'manual' && totalPlayers !== playerCount }">
                    Lancer la partie
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { rolesDataJSON } from '@/data/rolesData'

export default {
    name: 'RoleSelectionModal',

    props: {
        show: Boolean,
        playerCount: {
            type: Number,
            required: true
        }
    },

    emits: ['close', 'start-game-auto', 'start-game-manual'],

    setup(props, { emit }) {
        const activeTab = ref('auto')

        // Préparation des rôles pour la sélection manuelle en utilisant le JSON existant
        const werewolfRoles = ref([]);
        const villagerRoles = ref([]);
        const neutralRoles = ref([]);

        // Initialisation des rôles à partir du JSON
        onMounted(() => {
            // Parcourir le JSON des rôles et les répartir par camp
            Object.entries(rolesDataJSON).forEach(([name, roleData]) => {
                // Création de l'objet rôle avec les propriétés nécessaires
                const role = {
                    name,
                    ...roleData,
                    count: 0, // Valeur initiale à 0 pour tous les rôles
                };

                // Ajout de règles spécifiques selon le rôle sans initialiser de valeurs par défaut
                if (name === 'Loup-Garou') {
                    role.min = 0; // Pas de minimum requis
                    role.count = 0; // Valeur initiale à 0
                } else if (name === 'Infect Père des Loups') {
                    role.max = 1; // Maximum 1
                    role.count = 0; // Valeur initiale à 0
                } else if (name === 'Voyante' || name === 'Sorcière') {
                    role.min = 0; // Pas de minimum requis
                    role.count = 0; // Valeur initiale à 0
                } else if (['Cupidon', 'Salvateur', 'Ancien', 'Bouc Émissaire', 'Corbeau', 'Renard', 'Joueur de Flûte'].includes(name)) {
                    role.max = 1; // Maximum 1 pour ces rôles spéciaux
                    role.count = 0; // Valeur initiale à 0
                } else if (name === 'Villageois') {
                    role.count = 0; // Valeur initiale à 0
                }

                // Répartition dans les catégories
                if (roleData.camp === 'Loups-Garous') {
                    werewolfRoles.value.push(role);
                } else if (roleData.camp === 'Villageois') {
                    villagerRoles.value.push(role);
                } else if (roleData.camp === 'Neutre') {
                    neutralRoles.value.push(role);
                }
            });

            // Tri des rôles par "ordre" si disponible (pour un affichage cohérent)
            const sortByOrder = (a, b) => {
                if (a.ordre !== undefined && b.ordre !== undefined) {
                    return a.ordre - b.ordre;
                }
                return 0;
            };

            werewolfRoles.value.sort(sortByOrder);
            villagerRoles.value.sort(sortByOrder);
            neutralRoles.value.sort(sortByOrder);
        });

        // Calcul du total des joueurs
        const totalPlayers = computed(() => {
            let total = 0;
            werewolfRoles.value.forEach(role => total += role.count);
            villagerRoles.value.forEach(role => total += role.count);
            neutralRoles.value.forEach(role => total += role.count);
            return total;
        });

        // Vérification de l'équilibre du jeu (uniquement pour affichage informatif)
        const isBalanced = computed(() => {
            // Si le nombre total de joueurs ne correspond pas au nombre attendu
            if (totalPlayers.value !== props.playerCount) return false;

            // Calcul du nombre de loups-garous
            const werewolfCount = werewolfRoles.value.reduce((acc, role) => acc + role.count, 0);

            // Vérifier que le minimum de loups est respecté
            if (werewolfCount < 2) return false;

            // Vérifier que les loups ne sont pas trop nombreux (max 40%)
            if (werewolfCount > Math.ceil(props.playerCount * 0.4)) return false;

            // Vérifier qu'il y a au moins une voyante et une sorcière
            const hasVoyante = villagerRoles.value.find(role => role.name === 'Voyante')?.count > 0;
            const hasSorciere = villagerRoles.value.find(role => role.name === 'Sorcière')?.count > 0;

            if (!hasVoyante || !hasSorciere) return false;

            // Vérifier que les rôles uniques sont respectés
            for (const role of [...villagerRoles.value, ...neutralRoles.value, ...werewolfRoles.value]) {
                if (role.max === 1 && role.count > 1) return false;
            }

            return true;
        });

        // Incrémenter un rôle
        const incrementRole = (role) => {
            if (totalPlayers.value < props.playerCount) {
                if (!role.max || role.count < role.max) {
                    role.count++;
                }
            }
        };

        // Décrémenter un rôle
        const decrementRole = (role) => {
            if (role.count > 0) {
                role.count--;
            }
        };

        // Lancer la partie
        const startGame = () => {
            if (activeTab.value === 'auto') {
                emit('start-game-auto');
            } else {
                // Préparer les rôles sélectionnés pour l'envoi
                const selectedRoles = [];

                // Ajouter les loups-garous
                werewolfRoles.value.forEach(role => {
                    for (let i = 0; i < role.count; i++) {
                        selectedRoles.push({
                            role: role.name,
                            camp: role.camp
                        });
                    }
                });

                // Ajouter les villageois
                villagerRoles.value.forEach(role => {
                    for (let i = 0; i < role.count; i++) {
                        selectedRoles.push({
                            role: role.name,
                            camp: role.camp
                        });
                    }
                });

                // Ajouter les neutres
                neutralRoles.value.forEach(role => {
                    for (let i = 0; i < role.count; i++) {
                        selectedRoles.push({
                            role: role.name,
                            camp: role.camp
                        });
                    }
                });

                // Vérifier si le total de joueurs correspond au nombre attendu
                if (selectedRoles.length === props.playerCount) {
                    emit('start-game-manual', selectedRoles);
                } else {
                    // Informer l'utilisateur qu'il doit sélectionner exactement le bon nombre de rôles
                    alert(`Vous devez sélectionner exactement ${props.playerCount} rôles au total.`);
                }
            }
        };

        return {
            activeTab,
            werewolfRoles,
            villagerRoles,
            neutralRoles,
            totalPlayers,
            isBalanced,
            incrementRole,
            decrementRole,
            startGame
        };
    }
};
</script>