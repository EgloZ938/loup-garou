<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Titre et logo -->
      <div class="text-center mb-8">
        <div class="mb-4 relative w-24 h-24 mx-auto">
          <div class="absolute inset-0 bg-purple-500 rounded-full opacity-20 animate-pulse"></div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11c0 5.5-4.5 10-10 10S1 16.5 1 11m20 0c0-1.7-.3-3.3-.9-4.7C18.7 3.5 16 1 12 1S5.3 3.5 3.9 6.3C3.3 7.7 3 9.3 3 11m18 0H3m9-4v8m0-8l4 4m-4-4l-4 4"/>
          </svg>
        </div>
        <h1 class="text-4xl font-bold mb-2 text-purple-400">Loup-Garou</h1>
        <p class="text-gray-400">Rejoignez la partie et survivez à la nuit...</p>
      </div>

      <!-- Formulaire -->
      <div class="wolf-card p-6 space-y-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Nom du joueur</label>
            <input 
              v-model="username" 
              type="text" 
              required
              class="wolf-input"
              placeholder="Entrez votre nom..."
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Code de la partie</label>
            <input 
              v-model="roomCode" 
              type="text" 
              required
              class="wolf-input"
              placeholder="Entrez le code..."
            >
          </div>
          
          <div v-if="error" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
            {{ error }}
          </div>
          
          <div class="grid grid-cols-2 gap-4 pt-2">
            <button 
              type="button" 
              @click="joinRoom"
              class="wolf-button-primary"
            >
              Rejoindre
            </button>
            <button 
              type="button" 
              @click="createRoom"
              class="wolf-button-secondary"
            >
              Créer
            </button>
          </div>
        </form>
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
      
      // Vérifier si la room existe
      socketStore.socket.emit('checkRoom', roomCode.value);
      
      socketStore.socket.once('roomCheck', (exists) => {
        if (!exists) {
          error.value = "Cette room n'existe pas !";
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