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
          <div class="mb-4 relative w-40 h-40 mx-auto group">
            <!-- Effet d'ombre violette - Ajout d'une transition -->
            <div
              class="absolute inset-0 bg-purple-900/20 rounded-full animate-pulse transition-all duration-300 group-hover:bg-purple-600/30">
            </div>

            <svg xmlns="http://www.w3.org/2000/svg"
              class="relative h-full w-full text-purple-300 transition-all duration-300 group-hover:text-purple-200"
              viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <!-- Oreilles pointues -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9L2 3L8 6M19 9L22 3L16 6"
                class="text-purple-400 transition-colors duration-300 group-hover:text-purple-300" />

              <!-- Tête plus agressive -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 21C7 21 3 17 3 12C3 7 7 4 12 4C17 4 21 7 21 12C21 17 17 21 12 21Z" />

              <!-- Yeux violets lumineux avec animation -->
              <circle cx="9" cy="10" r="1.2"
                class="fill-purple-400 transition-colors duration-300 group-hover:fill-purple-200 animate-blink" />
              <circle cx="15" cy="10" r="1.2"
                class="fill-purple-400 transition-colors duration-300 group-hover:fill-purple-200 animate-blink" />

              <!-- Museau plus bestial avec animation -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 13L11 15.5L12 17L13 15.5L12 13Z" class="animate-snarl" />

              <!-- Crocs plus menaçants avec animation -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 15L8.5 17.5M14 15L15.5 17.5"
                class="text-purple-200 animate-growl" />

              <!-- Cicatrices -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 8L10 9M16 8L14 9"
                class="text-purple-500 transition-colors duration-300 group-hover:text-purple-300" />
            </svg>

            <!-- Ombre violette portée - Intensifiée au hover -->
            <div
              class="absolute -inset-1 bg-purple-900/30 blur-sm -z-10 rounded-full transition-all duration-300 group-hover:bg-purple-600/40 group-hover:blur-md">
            </div>
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

/* Animation des yeux qui clignent */
@keyframes blink {

  0%,
  95% {
    transform: scaleY(1);
  }

  97% {
    transform: scaleY(0.1);
  }

  100% {
    transform: scaleY(1);
  }
}

.animate-blink {
  animation: blink 4s infinite;
  transform-origin: center;
  transform-box: fill-box;
}

/* Animation du museau qui grogne */
@keyframes snarl {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(0.5px);
  }
}

.animate-snarl {
  animation: snarl 2s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}

/* Animation des crocs qui bougent */
@keyframes growl {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(0.3px) translateX(0.2px);
  }
}

.animate-growl {
  animation: growl 2s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box;
}

/* Ajout d'une animation spéciale au survol */
.group:hover .animate-blink {
  animation: blink 1s infinite;
}

.group:hover .animate-snarl {
  animation: snarl 0.5s ease-in-out infinite;
}

.group:hover .animate-growl {
  animation: growl 0.5s ease-in-out infinite;
}
</style>