<template>
  <div class="container mx-auto p-4">
    <div v-if="!currentRoom" class="max-w-md mx-auto">
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

    <div v-else class="max-w-md mx-auto">
      <div class="bg-gray-100 p-4 rounded mb-4">
        <h2 class="text-xl font-bold mb-2">Room: {{ roomCode }}</h2>
        <div class="mb-4">
          <h3 class="font-bold mb-2">Utilisateurs connectés:</h3>
          <ul class="list-disc pl-4">
            <li v-for="user in connectedUsers" :key="user">
              {{ user }}
            </li>
          </ul>
        </div>
        <button 
          @click="leaveRoom"
          class="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Quitter la room
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'App',
  setup() {
    const socket = ref(null);
    const username = ref('');
    const roomCode = ref('');
    const currentRoom = ref(null);
    const connectedUsers = ref([]);

    onMounted(() => {
      socket.value = io('http://localhost:3000');

      socket.value.on('userList', (users) => {
        connectedUsers.value = users;
      });

      socket.value.on('roomCreated', (room) => {
        currentRoom.value = room;
        roomCode.value = room;
      });
    });

    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect();
      }
    });

    const joinRoom = () => {
      if (!username.value || !roomCode.value) return;
      
      socket.value.emit('joinRoom', {
        username: username.value,
        room: roomCode.value
      });
      currentRoom.value = roomCode.value;
    };

    const createRoom = () => {
      if (!username.value) return;
      
      socket.value.emit('createRoom', {
        username: username.value
      });
    };

    const leaveRoom = () => {
      socket.value.emit('leaveRoom', {
        username: username.value,
        room: currentRoom.value
      });
      currentRoom.value = null;
      username.value = '';
      roomCode.value = '';
    };

    return {
      username,
      roomCode,
      currentRoom,
      connectedUsers,
      joinRoom,
      createRoom,
      leaveRoom
    };
  }
};
</script>
