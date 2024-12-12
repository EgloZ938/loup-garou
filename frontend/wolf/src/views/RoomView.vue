<template>
  <div class="max-w-2xl mx-auto p-4">
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
      
      <div class="grid grid-cols-3 gap-4">
        <!-- Liste des utilisateurs -->
        <div class="col-span-1">
          <h3 class="font-bold mb-2">Utilisateurs connectés:</h3>
          <ul class="list-disc pl-4">
            <li v-for="user in connectedUsers" :key="user">
              {{ user }}
            </li>
          </ul>
          
          <button 
            @click="leaveRoom"
            class="bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-4 w-full"
          >
            Quitter la room
          </button>
        </div>
        
        <!-- Chat -->
        <div class="col-span-2 bg-white rounded shadow">
          <!-- Messages -->
          <div class="h-96 p-4 overflow-y-auto" ref="chatBox">
            <div v-for="(msg, index) in messages" :key="index" class="mb-2">
              <!-- Message système -->
              <div v-if="msg.type === 'system'" class="text-gray-500 italic text-sm">
                {{ msg.content }}
              </div>
              <!-- Message utilisateur -->
              <div v-else class="text-gray-800">
                <span class="font-bold">{{ msg.username }}:</span>
                {{ msg.content }}
              </div>
            </div>
          </div>
          
          <!-- Input du chat -->
          <div class="p-4 border-t">
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <input 
                v-model="newMessage" 
                type="text" 
                class="flex-1 border p-2 rounded"
                placeholder="Votre message..."
              >
              <button 
                type="submit"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
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
    const messages = ref([]);
    const newMessage = ref('');
    const chatBox = ref(null);

    const hasUsername = computed(() => !!socketStore.username);

    const scrollToBottom = async () => {
      await nextTick();
      if (chatBox.value) {
        chatBox.value.scrollTop = chatBox.value.scrollHeight;
      }
    };

    onMounted(() => {
      socketStore.socket.emit('checkRoom', props.roomCode);
      
      socketStore.socket.once('roomCheck', (exists) => {
        if (!exists) {
          alert("Cette room n'existe pas !");
          router.push('/');
          return;
        }
        
        if (socketStore.username) {
          joinRoom();
        }
      });

      // Écouteurs de messages
      socketStore.socket.on('userList', (users) => {
        connectedUsers.value = users;
      });

      socketStore.socket.on('message', (message) => {
        messages.value.push(message);
        scrollToBottom();
      });

      socketStore.socket.on('systemMessage', (message) => {
        messages.value.push({
          type: 'system',
          content: message
        });
        scrollToBottom();
      });
    });

    onUnmounted(() => {
      if (socketStore.username) {
        leaveRoom();
      }
      socketStore.socket.off('message');
      socketStore.socket.off('systemMessage');
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

    const sendMessage = () => {
      if (!newMessage.value.trim()) return;
      
      socketStore.socket.emit('chatMessage', {
        username: socketStore.username,
        room: props.roomCode,
        message: newMessage.value
      });
      
      newMessage.value = '';
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
      messages,
      newMessage,
      chatBox,
      setUsername,
      sendMessage,
      leaveRoom,
      copyRoomLink
    };
  }
};
</script>