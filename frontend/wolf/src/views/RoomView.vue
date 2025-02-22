<template>
  <!-- Container principal avec fond et particules -->
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

    <!-- Modal username -->
    <div v-if="!hasUsername"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 w-full max-w-md p-6 rounded-xl">
        <h2 class="text-2xl font-bold mb-6 text-purple-400">Qui êtes-vous ?</h2>
        <input v-model="tempUsername" type="text" class="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500
                 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                 transition-colors mb-4" placeholder="Entrez votre nom..." @keyup.enter="setUsername" />
        <div v-if="error" class="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm mb-4">
          {{ error }}
        </div>
        <button @click="setUsername"
          class="wolf-button-primary w-full hover:scale-105 transition-transform duration-300">
          Rejoindre la partie
        </button>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-else class="max-w-6xl mx-auto p-6 h-screen flex flex-col">
      <!-- En-tête -->
      <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-6">
        <div class="flex justify-between items-center">
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
            <button v-if="isRoomCreator(socketStore.username) && !gameStarted" @click="startGame"
              :disabled="connectedUsers.length < 6"
              class="wolf-button-primary hover:scale-105 transition-transform duration-300"
              :class="{ 'opacity-50 cursor-not-allowed': connectedUsers.length < 6 }">
              Lancer la partie
              <span v-if="connectedUsers.length < 6" class="text-sm block">
                ({{ 6 - connectedUsers.length }} joueurs manquants)
              </span>
            </button>

            <button @click="copyRoomLink"
              class="wolf-button-secondary hover:scale-105 transition-transform duration-300"
              :disabled="connectedUsers.length >= 16">
              Inviter
            </button>
            <button @click="leaveRoom" class="wolf-button-danger hover:scale-105 transition-transform duration-300">
              Quitter
            </button>
          </div>
        </div>
      </div>

      <!-- Message d'attente -->
      <div v-if="!gameStarted && connectedUsers.length < 6"
        class="backdrop-blur-sm bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4 mt-6 text-center">
        <p class="text-indigo-300">
          En attente de plus de joueurs... (minimum 6 joueurs pour commencer)
        </p>
      </div>

      <!-- Grille principale -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 min-h-0">
        <!-- Liste des joueurs -->
        <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 p-6 flex flex-col rounded-xl min-h-0">
          <div class="flex items-center gap-2 mb-4 flex-shrink-0">
            <h3 class="text-lg font-bold flex-shrink-0" :class="{
              'text-purple-400': !gameStarted,
              'text-red-400': gameStarted && currentPlayerRole?.camp === 'Loups-Garous',
              'text-blue-400': gameStarted && currentPlayerRole?.camp === 'Villageois',
              'text-yellow-400': gameStarted && currentPlayerRole?.camp === 'Neutre'
            }">
              {{ gameStarted && currentPlayerRole ? currentPlayerRole.role : 'Villageois' }}
            </h3>
            <button v-if="gameStarted && currentPlayerRole" @click="showRoleModal = true"
              class="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-indigo-500/20 text-indigo-400"
              title="Cliquez pour voir les détails de votre rôle">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" />
              </svg>
            </button>
          </div>

          <!-- Container scrollable pour les joueurs -->
          <div class="flex-1 overflow-y-auto pr-2 min-h-0">
            <div class="space-y-2">
              <div v-for="user in connectedUsers" :key="user" :class="[
                'p-3 rounded-lg flex items-center gap-3 transition-all duration-300 hover:bg-purple-900/30',
                user === socketStore.username
                  ? 'backdrop-blur-sm bg-purple-900/20 border border-purple-500/20'
                  : 'backdrop-blur-sm bg-gray-800/10 border border-gray-700/20'
              ]" @contextmenu.prevent="
                isRoomCreator(socketStore.username) &&
                  user !== socketStore.username
                  ? showContextMenu($event, user)
                  : null
                ">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-gray-300">{{ user }}</span>
                  <!-- Couronne pour le créateur -->
                  <svg v-if="isRoomCreator(user)" class="w-4 h-4 text-yellow-500 shrink-0 animate-pulse"
                    viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Menu contextuel -->
          <div v-if="contextMenu.show"
            class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            @click="closeContextMenu">
            <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 w-64" @click.stop>
              <p class="text-gray-300 mb-4">
                Que souhaitez-vous faire avec {{ contextMenu.user }} ?
              </p>

              <div class="space-y-2">
                <button @click="promotePlayer(contextMenu.user)"
                  class="w-full px-4 py-2 text-left hover:bg-purple-900/30 flex items-center gap-2 rounded-lg transition-colors">
                  <svg class="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" />
                  </svg>
                  <span class="text-gray-300">Promouvoir</span>
                </button>

                <button @click="kickPlayer(contextMenu.user)"
                  class="w-full px-4 py-2 text-left hover:bg-red-900/30 flex items-center gap-2 rounded-lg transition-colors">
                  <svg class="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                  </svg>
                  <span class="text-red-400">Exclure</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat -->
        <div
          class="lg:col-span-3 backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 flex flex-col rounded-xl min-h-0">
          <!-- Messages -->
          <div class="flex-1 p-6 overflow-y-auto space-y-4 min-h-0" ref="chatBox">
            <div v-for="(msg, index) in messages" :key="index" :class="msg.type === 'system'
              ? 'text-purple-400 text-sm italic'
              : 'text-gray-300'">
              <template v-if="msg.type === 'system'">
                {{ msg.content }}
              </template>
              <template v-else>
                <span class="text-purple-400 font-medium">{{ msg.username }} : </span>
                <span class="text-gray-300">{{ msg.content }}</span>
              </template>
            </div>
          </div>

          <!-- Input du chat -->
          <div class="p-4 border-t border-purple-500/20 flex-shrink-0">
            <form @submit.prevent="sendMessage" class="flex gap-3">
              <input v-model="newMessage" type="text" class="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500
                 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                 transition-colors" placeholder="Votre message..." />
              <button type="submit"
                class="wolf-button-primary whitespace-nowrap hover:scale-105 transition-transform duration-300">
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Décompte -->
      <div v-if="showCountdown"
        class="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="text-center transform scale-100 opacity-100 transition-all duration-500">
          <h2 class="text-2xl font-bold mb-8 text-purple-400">La partie commence dans</h2>
          <div
            class="text-9xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent animate-pulse">
            {{ countdown }}
          </div>
        </div>
      </div>

      <!-- Loader -->
      <div v-if="showLoader"
        class="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-8 text-center">
          <div class="relative w-16 h-16 mx-auto mb-4">
            <div class="absolute inset-0 border-4 border-purple-400/20 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-t-purple-400 rounded-full animate-spin"></div>
          </div>
          <p class="text-purple-400 text-lg">Attribution des rôles en cours...</p>
        </div>
      </div>

      <!-- Révélation du rôle -->
      <div v-if="showRoleReveal"
        class="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="max-w-lg w-full text-center space-y-8 transform transition-all duration-700 ease-out"
          :class="{ 'translate-y-0 opacity-100': showRoleReveal, 'translate-y-10 opacity-0': !showRoleReveal }">
          <h2 class="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Vous êtes
          </h2>

          <!-- Image du rôle -->
          <div class="relative inline-block">
            <div class="absolute -inset-2 rounded-full opacity-50" :class="{
              'bg-red-500/20 animate-pulse': currentPlayerRole?.camp === 'Loups-Garous',
              'bg-blue-500/20 animate-pulse': currentPlayerRole?.camp === 'Villageois',
              'bg-yellow-500/20 animate-pulse': currentPlayerRole?.camp === 'Neutre'
            }"></div>
            <img :src="roleDetails?.icon" :alt="currentPlayerRole?.role"
              class="w-40 h-40 mx-auto rounded-full border-4 relative transform hover:scale-105 transition-transform duration-300"
              :class="{
                'border-red-400': currentPlayerRole?.camp === 'Loups-Garous',
                'border-blue-400': currentPlayerRole?.camp === 'Villageois',
                'border-yellow-400': currentPlayerRole?.camp === 'Neutre'
              }">
          </div>

          <div class="text-6xl font-bold" :class="{
            'text-red-400': currentPlayerRole?.camp === 'Loups-Garous',
            'text-blue-400': currentPlayerRole?.camp === 'Villageois',
            'text-yellow-400': currentPlayerRole?.camp === 'Neutre'
          }">
            {{ currentPlayerRole?.role }}
          </div>

          <div class="px-6 py-3 rounded-full inline-block" :class="{
            'bg-red-500/10 text-red-400': currentPlayerRole?.camp === 'Loups-Garous',
            'bg-blue-500/10 text-blue-400': currentPlayerRole?.camp === 'Villageois',
            'bg-yellow-500/10 text-yellow-400': currentPlayerRole?.camp === 'Neutre'
          }">
            {{ currentPlayerRole?.camp }}
          </div>

          <div class="text-gray-300 max-w-md mx-auto">
            {{ roleDetails?.description_courte }}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détail du rôle -->
    <RoleDetailModal v-if="showRoleModal" :show="showRoleModal" :role-name="currentPlayerRole?.role" :role="roleDetails"
      @close="showRoleModal = false" />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useSocketStore } from "../stores/socket";
import { rolesDataJSON } from '@/data/rolesData';
import RoleDetailModal from '@/components/RoleDetailModal.vue';

export default {
  components: {
    RoleDetailModal
  },
  props: {
    roomCode: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter();
    const socketStore = useSocketStore();
    const connectedUsers = ref([]);
    const tempUsername = ref("");
    const messages = ref([]);
    const newMessage = ref("");
    const chatBox = ref(null);
    const roomCreator = ref("");
    const gameStarted = ref(false);
    const contextMenu = ref({
      show: false,
      user: null,
    });
    const countdown = ref(null);
    const showCountdown = ref(false);
    const showLoader = ref(false);
    const rolesData = ref(null);
    const showRoleReveal = ref(false);
    const currentPlayerRole = ref(null);
    const error = ref("");
    const showRoleModal = ref(false);

    const hasUsername = computed(() => !!socketStore.username);

    const isRoomCreator = (username) => {
      return username === roomCreator.value;
    };

    const closeContextMenu = () => {
      contextMenu.value.show = false;
    };

    const showContextMenu = (event, user) => {
      event.preventDefault();
      contextMenu.value = {
        show: true,
        user: user,
      };
    };

    const promotePlayer = (username) => {
      socketStore.socket.emit("promotePlayer", {
        room: props.roomCode,
        newCreator: username,
        currentCreator: socketStore.username,
      });
      closeContextMenu();
    };

    const kickPlayer = (username) => {
      console.log("Tentative d'exclure:", username);
      socketStore.socket.emit("kickPlayer", {
        room: props.roomCode,
        username: username,
      });
      closeContextMenu();
    };

    const startGame = () => {
      if (connectedUsers.value.length >= 6 && isRoomCreator(socketStore.username)) {
        socketStore.socket.emit("startGame", props.roomCode);
      }
    };

    const scrollToBottom = async () => {
      await nextTick();
      if (chatBox.value) {
        chatBox.value.scrollTop = chatBox.value.scrollHeight;
      }
    };

    const handleBeforeUnload = (event) => {
      if (socketStore.username && props.roomCode) {
        socketStore.socket.emit("leaveRoom", {
          username: socketStore.username,
          room: props.roomCode,
        });
      }
    };

    const handleContextMenu = (event, user) => {
      console.log("Click droit sur:", user);
      console.log("Username actuel:", socketStore.username);
      console.log("Créateur:", roomCreator.value);
      console.log("Est créateur?", isRoomCreator(socketStore.username));

      if (
        isRoomCreator(socketStore.username) &&
        user !== socketStore.username
      ) {
        showContextMenu(event, user);
      }
    };


    const startCountdown = () => {
      showCountdown.value = true;
      countdown.value = 5;

      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value === 0) {
          clearInterval(timer);
          showCountdown.value = false;

          if (rolesData.value) {
            showRoleReveal.value = true;
            // On cache la révélation après 4 secondes
            setTimeout(() => {
              showRoleReveal.value = false;
            }, 4000);
          } else {
            showLoader.value = true;
          }
        }
      }, 1000);
    };

    const roleDetails = computed(() => {
      if (currentPlayerRole.value?.role) {
        return rolesDataJSON[currentPlayerRole.value.role];
      }
      return null;
    });

    onMounted(() => {
      window.addEventListener("beforeunload", handleBeforeUnload);
      socketStore.socket.emit("checkRoom", props.roomCode);
      document.addEventListener("click", closeContextMenu);

      socketStore.socket.once("roomCheck", ({ exists, creator, isFull }) => {
        if (!exists) {
          alert("Cette room n'existe pas !");
          router.push("/");
          return;
        }

        if (isFull) {
          alert("Cette room est complète (16/16 joueurs) !");
          router.push("/");
          return;
        }

        roomCreator.value = creator;
        if (socketStore.username) {
          joinRoom();
        }
      });

      socketStore.socket.on("userList", ({ users, creator }) => {
        connectedUsers.value = users;
        roomCreator.value = creator;
      });

      socketStore.socket.on("message", (message) => {
        messages.value.push(message);
        scrollToBottom();
      });

      socketStore.socket.on("systemMessage", (message) => {
        messages.value.push({
          type: "system",
          content: message,
        });
        scrollToBottom();
      });

      socketStore.socket.on('gameStatus', ({ started, roles }) => {
        gameStarted.value = started;
        if (roles) {
          console.log('Rôles attribués:', roles);
          try {
            // On parse la string en JSON
            const parsedRoles = JSON.parse(roles);
            rolesData.value = parsedRoles;

            // Trouvons le rôle du joueur actuel
            const playerData = parsedRoles.players.find(
              player => player.pseudo === socketStore.username
            );
            if (playerData) {
              currentPlayerRole.value = playerData;
            }
          } catch (error) {
            console.error('Erreur lors du traitement des rôles:', error);
          }
        }
      });

      socketStore.socket.on("playerKicked", ({ username }) => {
        if (username === socketStore.username) {
          alert("Vous avez été exclu de la partie");
          router.push("/");
        }
      });

      socketStore.socket.on('startCountdown', () => {
        showCountdown.value = true;
        countdown.value = 5;

        const timer = setInterval(() => {
          countdown.value--;
          if (countdown.value === 0) {
            clearInterval(timer);
            showCountdown.value = false;

            if (currentPlayerRole.value) {
              showRoleReveal.value = true;
              setTimeout(() => {
                showRoleReveal.value = false;
              }, 4000);
            } else {
              showLoader.value = true;
            }
          }
        }, 1000);
      });
    });

    onUnmounted(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (socketStore.username) {
        leaveRoom();
      }
      document.removeEventListener("click", closeContextMenu);
      socketStore.socket.off("userList");
      socketStore.socket.off("message");
      socketStore.socket.off("systemMessage");
      socketStore.socket.off("gameStatus");
      socketStore.socket.off("playerKicked");
    });

    const setUsername = () => {
      if (!tempUsername.value) return;
      error.value = '';

      socketStore.socket.emit('checkRoom', props.roomCode);
      socketStore.socket.once('roomCheck', ({ exists, isFull, usedUsernames }) => {
        if (!exists) {
          error.value = "Cette room n'existe pas !";
          return;
        }

        if (isFull) {
          error.value = "Cette room est complète !";
          return;
        }

        if (usedUsernames.includes(tempUsername.value)) {
          error.value = "Ce pseudo est déjà utilisé dans cette room !";
          return;
        }

        socketStore.setUsername(tempUsername.value);
        joinRoom();
      });
    };


    const joinRoom = () => {
      // Configuration de l'auth
      socketStore.socket.auth = { username: socketStore.username };
      socketStore.socket.disconnect().connect(); // Force la reconnexion avec la nouvelle auth

      socketStore.socket.emit("joinRoom", {
        username: socketStore.username,
        room: props.roomCode,
      });
    };

    const sendMessage = () => {
      if (!newMessage.value.trim()) return;

      socketStore.socket.emit("chatMessage", {
        username: socketStore.username,
        room: props.roomCode,
        message: newMessage.value,
      });

      newMessage.value = "";
    };

    const copyRoomLink = () => {
      const link = `${window.location.origin}/room/${props.roomCode}`;
      navigator.clipboard.writeText(link);
      alert("Lien copié dans le presse-papier !");
    };

    const leaveRoom = () => {
      socketStore.socket.emit("leaveRoom", {
        username: socketStore.username,
        room: props.roomCode,
      });
      socketStore.setUsername(null);
      router.push("/");
    };

    return {
      connectedUsers,
      hasUsername,
      tempUsername,
      messages,
      newMessage,
      chatBox,
      socketStore,
      error,
      gameStarted,
      contextMenu,
      setUsername,
      sendMessage,
      leaveRoom,
      copyRoomLink,
      isRoomCreator,
      startGame,
      showContextMenu,
      promotePlayer,
      kickPlayer,
      countdown,
      showCountdown,
      showLoader,
      rolesData,
      rolesDataJSON,
      roleDetails,
      showRoleReveal,
      currentPlayerRole,
      showRoleModal,
    };
  },
};
</script>
