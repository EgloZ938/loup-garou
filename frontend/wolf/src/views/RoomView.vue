<template>
  <div class="max-w-md mx-auto p-4">
    <!-- Modal pour le nom d'utilisateur -->
    <div v-if="!hasUsername" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-xl font-bold mb-4">Entrez votre nom d'utilisateur</h2>
        <input 
          v-model="tempUsername" 
          type="text" 
          class="w-full border p-2 rounded mb-4"
          placeholder="Votre nom"
          @keyup.enter="setUsername"
        >
        <button 
          @click="setUsername"
          class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Rejoindre la room
        </button>
      </div>
    </div>

    <!-- Contenu de la room -->
    <div v-else class="bg-gray-100 p-4 rounded mb-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Room: {{ roomCode }}</h2>
        <button 
          @click="copyRoomLink"
          class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Copier le lien
        </button>
      </div>
      
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
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSocketStore } from '../stores/socket';

export default {
  props: {
    roomCode: {
      type: String,
      required: true
    }
  },
  
  setup(props) {
    const router = useRouter();
    const socketStore = useSocketStore();
    const connectedUsers = ref([]);
    const tempUsername = ref('');

    const hasUsername = computed(() => !!socketStore.username);

    onMounted(() => {
      // Vérifier si la room existe
      socketStore.socket.emit('checkRoom', props.roomCode);
      
      socketStore.socket.once('roomCheck', (exists) => {
        if (!exists) {
          alert("Cette room n'existe pas !");
          router.push('/');
          return;
        }
        
        // Si on a déjà un username, on rejoint directement
        if (socketStore.username) {
          joinRoom();
        }
      });

      socketStore.socket.on('userList', (users) => {
        connectedUsers.value = users;
      });
    });

    onUnmounted(() => {
      if (socketStore.username) {
        leaveRoom();
      }
    });

    const setUsername = () => {
      if (!tempUsername.value) return;
      
      socketStore.setUsername(tempUsername.value);
      joinRoom();
    };

    const joinRoom = () => {
      socketStore.socket.emit('joinRoom', {
        username: socketStore.username,
        room: props.roomCode
      });
    };

    const copyRoomLink = () => {
      const link = `${window.location.origin}/room/${props.roomCode}`;
      navigator.clipboard.writeText(link);
      alert('Lien copié dans le presse-papier !');
    };

    const leaveRoom = () => {
      socketStore.socket.emit('leaveRoom', {
        username: socketStore.username,
        room: props.roomCode
      });
      socketStore.setUsername(null);
      router.push('/');
    };

    return {
      connectedUsers,
      hasUsername,
      tempUsername,
      setUsername,
      leaveRoom,
      copyRoomLink
    };
  }
};
</script>