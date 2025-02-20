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

    <div class="min-h-screen flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md opacity-0 animate-fade-in">
        <!-- Titre et logo -->
        <div class="text-center mb-8">
          <div class="mb-4 relative w-24 h-24 mx-auto">
            <div class="absolute inset-0 bg-purple-500/20 rounded-full animate-pulse"></div>
            <svg xmlns="http://www.w3.org/2000/svg"
              class="h-full w-full text-purple-400 transform hover:scale-110 transition-transform duration-300"
              viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 11c0 5.5-4.5 10-10 10S1 16.5 1 11m20 0c0-1.7-.3-3.3-.9-4.7C18.7 3.5 16 1 12 1S5.3 3.5 3.9 6.3C3.3 7.7 3 9.3 3 11m18 0H3m9-4v8m0-8l4 4m-4-4l-4 4" />
            </svg>
          </div>
          <h1 class="text-4xl font-bold mb-2 text-purple-400">Loup-Garou</h1>
          <p class="text-gray-400">Rejoignez la partie et survivez à la nuit...</p>
        </div>

        <!-- Formulaire -->
        <div class="wolf-card p-6 space-y-6 backdrop-blur-sm bg-purple-900/10 border border-purple-500/20">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Nom du joueur</label>
              <input v-model="username" type="text" required class="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500
                         focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                         transition-colors" placeholder="Entrez votre nom...">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Code de la partie</label>
              <input v-model="roomCode" type="text" required class="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500
                         focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                         transition-colors" placeholder="Entrez le code...">
            </div>
            <div v-if="error" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
              {{ error }}
            </div>
            <div class="grid grid-cols-2 gap-4 pt-2">
              <button type="button" @click="joinRoom"
                class="wolf-button-primary hover:scale-105 transition-transform duration-300">
                Rejoindre
              </button>
              <button type="button" @click="createRoom"
                class="wolf-button-secondary hover:scale-105 transition-transform duration-300">
                Créer
              </button>
            </div>
          </form>
        </div>

        <!-- Bouton pour voir les rôles -->
        <div class="text-center mt-8 opacity-0 animate-fade-in animation-delay-200">
          <router-link to="/roles" class="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-purple-500/10 text-purple-400 
                             hover:bg-purple-500/20 transition-all duration-300 hover:scale-105 group">
            <span>Découvrir les rôles</span>
            <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSocketStore } from '../stores/socket';

export default {
  setup() {
    const router = useRouter();
    const socketStore = useSocketStore();
    const username = ref('');
    const roomCode = ref('');
    const error = ref('');

    const joinRoom = () => {
      if (!username.value || !roomCode.value) return;
      error.value = '';

      socketStore.socket.emit('checkRoom', roomCode.value);
      socketStore.socket.once('roomCheck', ({ exists, isFull, usedUsernames }) => {
        if (!exists) {
          error.value = "Cette room n'existe pas !";
          return;
        }

        if (isFull) {
          error.value = "Cette room est complète !";
          return;
        }

        // On vérifie si le pseudo est déjà utilisé
        if (usedUsernames.includes(username.value)) {
          error.value = "Ce pseudo est déjà utilisé dans cette room !";
          return;
        }

        socketStore.setUsername(username.value);
        router.push(`/room/${roomCode.value}`);
      });
    };

    const createRoom = () => {
      if (!username.value) return;
      error.value = '';

      socketStore.socket.emit('createRoom', {
        username: username.value
      });

      socketStore.socket.once('roomCreated', (roomCode) => {
        socketStore.setUsername(username.value);
        router.push(`/room/${roomCode}`);
      });
    };

    return {
      username,
      roomCode,
      error,
      joinRoom,
      createRoom
    };
  }
};
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
</style>