<template>
    <div class="min-h-screen p-4">
        <div class="max-w-3xl mx-auto">
            <!-- Bouton retour -->
            <router-link to="/roles" class="inline-flex items-center text-purple-400 hover:text-purple-300 mb-8">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour aux rôles
            </router-link>

            <div v-if="roleDetails" class="wolf-card p-6">
                <div class="text-center mb-8">
                    <img :src="roleDetails.icon" :alt="roleName" class="w-32 h-32 mx-auto rounded-full border-4 mb-4"
                        :class="{
                            'border-red-400': roleDetails.camp === 'Loups-Garous',
                            'border-blue-400': roleDetails.camp === 'Villageois',
                            'border-yellow-400': roleDetails.camp === 'Neutre'
                        }">
                    <h2 class="text-3xl font-bold mb-2" :class="{
                        'text-red-400': roleDetails.camp === 'Loups-Garous',
                        'text-blue-400': roleDetails.camp === 'Villageois',
                        'text-yellow-400': roleDetails.camp === 'Neutre'
                    }">{{ roleName }}</h2>
                    <p class="text-purple-400">{{ roleDetails.camp }}</p>
                </div>

                <div class="space-y-6 text-gray-300">
                    <p class="text-lg">{{ roleDetails.description_detaillee }}</p>

                    <div class="bg-gray-800/50 p-4 rounded-lg">
                        <h3 class="text-purple-400 font-medium mb-4">Caractéristiques</h3>
                        <ul class="space-y-3">
                            <li><span class="text-purple-400">Pouvoirs :</span> {{ roleDetails.caracteristiques.pouvoirs
                                }}</li>
                            <li><span class="text-purple-400">Actions de nuit :</span> {{
                                roleDetails.caracteristiques.actions_de_nuit }}</li>
                            <li><span class="text-purple-400">Conditions de victoire :</span> {{
                                roleDetails.caracteristiques.conditions_de_victoire }}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { rolesDataJSON } from '@/data/rolesData';

export default {
    setup() {
        const route = useRoute();
        const roleName = computed(() => {
            return Object.keys(rolesDataJSON).find(
                name => name.toLowerCase() === route.params.role
            );
        });

        const roleDetails = computed(() => {
            return roleName.value ? rolesDataJSON[roleName.value] : null;
        });

        return {
            roleName,
            roleDetails
        }
    }
}
</script>