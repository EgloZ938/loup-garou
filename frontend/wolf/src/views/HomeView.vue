<template>
  <div class="max-w-md mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Connexion à une Room</h1>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block mb-1">Nom d'utilisateur</label>
        <input 
          v-model="username" 
          type="text" 
          required
          class="w-full border p-2 rounded"
        >
      </div>
      
      <div>
        <label class="block mb-1">Code de la room</label>
        <input 
          v-model="roomCode" 
          type="text" 
          required
          class="w-full border p-2 rounded"
        >
      </div>
      
      <div v-if="error" class="text-red-500 p-2 rounded bg-red-50 mb-2">
        {{ error }}
      </div>
      
      <div class="flex gap-4">
        <button 
          type="button" 
          @click="joinRoom"
          class="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Rejoindre la room
        </button>
        <button 
          type="button" 
          @click="createRoom"
          class="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Créer la room
        </button>
      </div>
    </form>
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