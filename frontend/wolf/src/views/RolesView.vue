<template>
    <div class="min-h-screen p-4">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-purple-400 mb-8">Les Rôles du Loup-Garou</h2>

            <!-- Grille des rôles -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <router-link v-for="(role, name) in rolesDataJSON" :key="name" :to="`/roles/${name.toLowerCase()}`"
                    class="wolf-card p-4 hover:bg-gray-800/50 transition-colors">
                    <div class="text-center space-y-3">
                        <img :src="role.icon" :alt="name" class="w-24 h-24 mx-auto rounded-full border-2" :class="{
                            'border-red-400': role.camp === 'Loups-Garous',
                            'border-blue-400': role.camp === 'Villageois',
                            'border-yellow-400': role.camp === 'Neutre'
                        }">
                        <h3 class="font-bold text-lg" :class="{
                            'text-red-400': role.camp === 'Loups-Garous',
                            'text-blue-400': role.camp === 'Villageois',
                            'text-yellow-400': role.camp === 'Neutre'
                        }">{{ name }}</h3>
                        <p class="text-gray-400 text-sm">{{ role.description_courte }}</p>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
import { rolesDataJSON } from '@/data/rolesData';

export default {
    setup() {
        return {
            rolesDataJSON
        }
    }
}
</script>