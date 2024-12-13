<template>
  <div class="min-h-screen p-4">
    <!-- Modal username -->
    <div v-if="!hasUsername" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="wolf-card w-full max-w-md p-6">
        <h2 class="text-2xl font-bold mb-6 text-purple-400">Qui êtes-vous ?</h2>
        <input 
          v-model="tempUsername" 
          type="text" 
          class="wolf-input mb-4"
          placeholder="Entrez votre nom..."
          @keyup.enter="setUsername"
        >
        <button 
          @click="setUsername"
          class="wolf-button-primary w-full"
        >
          Rejoindre la partie
        </button>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-else class="max-w-6xl mx-auto">
      <!-- En-tête -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-purple-400">
            Room: <span class="text-gray-300">{{ roomCode }}</span>
          </h2>
          <div class="flex items-center gap-2">
            <p class="text-gray-400 text-sm">La nuit va bientôt tomber...</p>
            <span class="text-purple-400 text-sm">({{ connectedUsers.length }}/16 joueurs)</span>
          </div>
        </div>
        <div class="flex gap-4">
          <!-- Bouton pour lancer la partie (uniquement pour le créateur) -->
          <button 
            v-if="isRoomCreator(socketStore.username) && !gameStarted"
            @click="startGame"
            :disabled="connectedUsers.length < 6"
            class="wolf-button-primary"
            :class="{'opacity-50 cursor-not-allowed': connectedUsers.length < 6}"
          >
            Lancer la partie
            <span v-if="connectedUsers.length < 6" class="text-sm block">
              ({{ 6 - connectedUsers.length }} joueurs manquants)
            </span>
          </button>

          <button 
            @click="copyRoomLink"
            class="wolf-button-secondary"
            :disabled="connectedUsers.length >= 16"
          >
            Inviter
          </button>
          <button 
            @click="leaveRoom"
            class="wolf-button-danger"
          >
            Quitter
          </button>
        </div>
      </div>

      <!-- Message d'attente -->
      <div v-if="!gameStarted && connectedUsers.length < 6" 
           class="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6 text-center">
        <p class="text-purple-300">
          En attente de plus de joueurs... (minimum 6 joueurs pour commencer)
        </p>
      </div>

      <!-- Grille principale -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Liste des joueurs -->
        <div class="wolf-card p-6">
          <h3 class="text-lg font-bold mb-4 text-purple-400">Villageois</h3>
          <div class="space-y-2">
            <div 
              v-for="user in connectedUsers" 
              :key="user"
              :class="[
                'p-3 rounded-lg flex items-center gap-3 transition-colors',
                user === socketStore.username 
                  ? 'bg-purple-900/50 border border-purple-700/50' 
                  : 'bg-gray-700/50'
              ]"
            >
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <div class="flex items-center gap-2 flex-1">
                <span>{{ user }}</span>
                <!-- Couronne pour le créateur -->
                <svg 
                  v-if="isRoomCreator(user)"
                  class="w-4 h-4 text-yellow-500" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat -->
        <div class="lg:col-span-3 wolf-card flex flex-col" style="height: calc(100vh - 200px)">
          <!-- Messages -->
          <div class="flex-1 p-6 overflow-y-auto space-y-4" ref="chatBox">
            <div 
              v-for="(msg, index) in messages" 
              :key="index"
              :class="msg.type === 'system' ? 'text-purple-400 text-sm italic' : 'text-gray-300'"
            >
              <template v-if="msg.type === 'system'">
                {{ msg.content }}
              </template>
              <template v-else>
                <span class="text-purple-400 font-medium">{{ msg.username }}:</span>
                {{ msg.content }}
              </template>
            </div>
          </div>

          <!-- Input du chat -->
          <div class="p-4 border-t border-gray-700">
            <form @submit.prevent="sendMessage" class="flex gap-3">
              <input 
                v-model="newMessage" 
                type="text" 
                class="wolf-input flex-1"
                placeholder="Votre message..."
              >
              <button 
                type="submit"
                class="wolf-button-primary whitespace-nowrap"
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
    const roomCreator = ref('');
    const gameStarted = ref(false);

    const hasUsername = computed(() => !!socketStore.username);

    const isRoomCreator = (username) => {
      return username === roomCreator.value;
    };

    const startGame = () => {
      if (connectedUsers.value.length >= 6 && isRoomCreator(socketStore.username)) {
        socketStore.socket.emit('startGame', props.roomCode);
      }
    };

    const scrollToBottom = async () => {
      await nextTick();
      if (chatBox.value) {
        chatBox.value.scrollTop = chatBox.value.scrollHeight;
      }
    };

    onMounted(() => {
      socketStore.socket.emit('checkRoom', props.roomCode);
      
      socketStore.socket.once('roomCheck', ({ exists, creator, isFull }) => {
        if (!exists) {
          alert("Cette room n'existe pas !");
          router.push('/');
          return;
        }

        if (isFull) {
          alert("Cette room est complète (16/16 joueurs) !");
          router.push('/');
          return;
        }
        
        roomCreator.value = creator;
        if (socketStore.username) {
          joinRoom();
        }
      });

      socketStore.socket.on('userList', ({ users, creator }) => {
        connectedUsers.value = users;
        roomCreator.value = creator;
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

      socketStore.socket.on('gameStatus', ({ started }) => {
        gameStarted.value = started;
      });
    });

    onUnmounted(() => {
      if (socketStore.username) {
        leaveRoom();
      }
      socketStore.socket.off('userList');
      socketStore.socket.off('message');
      socketStore.socket.off('systemMessage');
      socketStore.socket.off('gameStatus');
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
      socketStore,
      gameStarted,
      setUsername,
      sendMessage,
      leaveRoom,
      copyRoomLink,
      isRoomCreator,
      startGame
    };
  }
};
</script>