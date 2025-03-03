<template>
  <!-- Container principal avec fond et particules -->
  <div class="min-h-screen relative overflow-hidden transition-all duration-1000" :class="{
    'bg-gradient-to-b from-gray-900 to-gray-950': gamePhase !== 'night',
    'bg-gradient-to-b from-blue-950 to-gray-950': gamePhase === 'night'
  }">
    <!-- Particules/étoiles en arrière-plan -->
    <div class="absolute inset-0 overflow-hidden transition-opacity duration-1000"
      :class="{ 'opacity-20': gamePhase !== 'night', 'opacity-100': gamePhase === 'night' }">
      <div v-for="i in 40" :key="i" class="absolute rounded-full animate-twinkle" :class="{
        'bg-purple-400/20 w-1 h-1': gamePhase !== 'night',
        'bg-blue-400/70': gamePhase === 'night'
      }" :style="{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        width: gamePhase === 'night' ? `${Math.random() * 2 + 1}px` : '1px',
        height: gamePhase === 'night' ? `${Math.random() * 2 + 1}px` : '1px'
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
    <div v-else :class="[
      'mx-auto p-6 h-screen flex flex-col',
      gameStarted ? 'max-w-8xl' : 'max-w-6xl'
    ]">
      <!-- En-tête -->
      <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl p-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-purple-400">
              Room: <span class="text-gray-300">{{ roomCode }}</span>
            </h2>
            <div class="flex items-center gap-2">
              <p class="text-gray-400 text-sm">
                <template v-if="!gameStarted">La nuit va bientôt tomber...</template>
                <template v-else>La partie est en cours</template>
              </p>
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

      <!-- Grille principale - Affichage différent selon si la partie est lancée ou non -->
      <div v-if="!gameStarted" class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 min-h-0">
        <!-- Liste des joueurs - Avant le début de partie -->
        <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 p-6 flex flex-col rounded-xl min-h-0">
          <div class="flex items-center gap-2 mb-4 flex-shrink-0">
            <h3 class="text-lg font-bold flex-shrink-0 text-purple-400">
              Villageois
            </h3>
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
        </div>

        <!-- Chat - Avant le début de partie -->
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

      <!-- Vue de jeu - Après le début de partie -->
      <div v-if="gameStarted" class="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6 min-h-0">
        <!-- Liste des joueurs - Maintenue à gauche -->
        <div class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 p-6 flex flex-col rounded-xl min-h-0">
          <div class="flex items-center gap-2 mb-4 flex-shrink-0">
            <h3 class="text-lg font-bold flex-shrink-0" :class="{
              'text-red-400': currentPlayerRole?.camp === 'Loups-Garous',
              'text-blue-400': currentPlayerRole?.camp === 'Villageois',
              'text-yellow-400': currentPlayerRole?.camp === 'Neutre'
            }">
              {{ currentPlayerRole ? currentPlayerRole.role : 'Villageois' }}
            </h3>
            <button v-if="currentPlayerRole" @click="showRoleModal = true"
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
              ]">
                <!-- Modifie cette ligne pour changer la couleur selon si le joueur est mort -->
                <div class="w-2 h-2 rounded-full animate-pulse" :class="{
                  'bg-green-500': !deadPlayers.includes(user),
                  'bg-red-500': deadPlayers.includes(user)
                }"></div>
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
        </div>

        <!-- Zone centrale - Cercle des joueurs -->
        <div
          class="lg:col-span-4 backdrop-blur-sm rounded-xl flex flex-col min-h-0 relative transition-all duration-1000"
          :class="{
            'bg-purple-900/10 border border-purple-500/20': gamePhase !== 'night',
            'bg-blue-950/30 border border-blue-600/20': gamePhase === 'night'
          }">
          <h3 class="text-xl font-bold text-purple-400 mb-4 absolute top-6 left-6">Village</h3>

          <div v-if="gameStarted && (gamePhase === 'day' || gamePhase === 'night' || gamePhase === 'vote')"
            class="absolute top-6 right-6 flex items-center gap-4">
            <!-- Indicateur de phase -->
            <div class="flex items-center gap-2">
              <div v-if="gamePhase === 'day'" class="flex items-center">
                <svg class="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clip-rule="evenodd"></path>
                </svg>
                <span class="text-yellow-400 text-lg font-semibold ml-1">Jour</span>
              </div>
              <div v-else-if="gamePhase === 'night'" class="flex items-center">
                <svg class="w-7 h-7 text-blue-400" fill="currentColor" viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
                <span class="text-blue-400 text-lg font-semibold ml-1">Nuit</span>
              </div>
              <div v-else-if="gamePhase === 'vote'" class="flex items-center">
                <svg class="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.035-.691-.1-1.021A5 5 0 0010 11z"
                    clip-rule="evenodd"></path>
                </svg>
                <span class="text-purple-400 text-lg font-semibold ml-1">Vote</span>
              </div>
            </div>

            <!-- Timer -->
            <div
              class="backdrop-blur-sm bg-purple-900/30 border border-purple-500/30 rounded-full px-5 py-2 flex items-center">
              <svg class="w-5 h-5 mr-2" :class="{
                'text-yellow-400': gamePhase === 'day',
                'text-blue-400': gamePhase === 'night',
                'text-purple-400': gamePhase === 'vote'
              }" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-xl font-bold" :class="{
                'text-yellow-400': gamePhase === 'day',
                'text-blue-400': gamePhase === 'night',
                'text-purple-400': gamePhase === 'vote'
              }">
                {{ clientTimer }}s
              </span>
            </div>

            <div v-if="gamePhase === 'vote'"
              class="absolute top-20 left-0 right-0 mx-auto text-center bg-purple-900/50 backdrop-blur-sm border border-purple-500/40 py-3 px-6 rounded-lg max-w-lg shadow-lg">
              <p class="text-purple-200 font-semibold">Cliquez sur l'avatar d'un joueur pour voter contre lui</p>
              <p v-if="currentVote" class="text-purple-300 text-sm mt-1">
                Votre vote actuel: <span class="font-semibold">{{ currentVote }}</span>
              </p>
            </div>
          </div>

          <!-- Cercle des joueurs -->
          <div class="flex-1 relative" style="min-height: 700px;">
            <div class="absolute inset-0 flex items-center justify-center">
              <!-- Cercle de fond -->
              <div class="rounded-full border border-purple-500/20 relative" style="height: 95%; width: 70%;">

                <!-- Joueurs positionnés en cercle -->
                <div v-for="(user, index) in connectedUsers" :key="user" class="absolute" :style="{
                  top: `${50 + 42 * Math.sin(2 * Math.PI * index / connectedUsers.length)}%`,
                  left: `${50 + 42 * Math.cos(2 * Math.PI * index / connectedUsers.length)}%`,
                  transform: 'translate(-50%, -50%)'
                }">
                  <div class="flex flex-col items-center justify-center">
                    <!-- Avatar avec indication de rôle et possibilité de vote -->
                    <div class="relative">
                      <img src="/src/assets/images/roles/avatar_default2.png" alt="Avatar"
                        class="w-20 h-20 rounded-full border-2 transition-transform duration-300" :class="{
                          'border-red-400': isWerewolf(user) && (user === socketStore.username || isWerewolf(socketStore.username)),
                          'border-gray-500': !isWerewolf(user) || (isWerewolf(user) && user !== socketStore.username && !isWerewolf(socketStore.username)),
                          'border-purple-400': user === socketStore.username,
                          'opacity-50 grayscale cursor-not-allowed': deadPlayers.includes(user) || deadPlayers.includes(socketStore.username),
                          'cursor-pointer hover:scale-110 hover:border-white hover:border-opacity-70': gamePhase === 'vote' && !deadPlayers.includes(user) && user !== socketStore.username && !deadPlayers.includes(socketStore.username),
                          'hover:scale-105': gamePhase !== 'vote' && !deadPlayers.includes(user)
                        }"
                        @click="gamePhase === 'vote' && !deadPlayers.includes(user) && user !== socketStore.username && !deadPlayers.includes(socketStore.username) ? voteForPlayer(user) : null">

                      <!-- Indicateur de vote -->
                      <div v-if="gamePhase === 'vote' && getVotesForPlayer(user) > 0"
                        class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-red-700 animate-pulse">
                        {{ getVotesForPlayer(user) }}
                      </div>

                      <!-- Indicateur de vote actuel de l'utilisateur -->
                      <div v-if="gamePhase === 'vote' && currentVote === user"
                        class="absolute -top-2 -left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-lg border border-purple-700">
                        Votre vote
                      </div>

                      <!-- Indicateur de rôle (visible uniquement pour son propre rôle ou entre loups) -->
                      <div
                        v-if="user === socketStore.username || (isWerewolf(user) && isWerewolf(socketStore.username)) || deadPlayers.includes(user)"
                        class="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2" :class="{
                          'border-red-400 bg-red-900/50': isWerewolf(user),
                          'border-blue-400 bg-blue-900/50': getPlayerRole(user)?.camp === 'Villageois',
                          'border-yellow-400 bg-yellow-900/50': getPlayerRole(user)?.camp === 'Neutre',
                          'opacity-75': deadPlayers.includes(user)
                        }">
                        <img v-if="getPlayerRoleDetails(user)" :src="getPlayerRoleDetails(user)?.icon"
                          :alt="getPlayerRole(user)?.role" class="w-full h-full rounded-full">
                      </div>

                      <!-- Indicateur de mort -->
                      <div v-if="deadPlayers.includes(user)" class="absolute inset-0 flex items-center justify-center">
                        <!-- Première série de griffures (3 traits) -->
                        <div
                          class="absolute h-0.5 w-20 bg-red-600 transform rotate-45 translate-y-2 shadow-lg shadow-red-900/50">
                        </div>
                        <div class="absolute h-0.5 w-20 bg-red-600 transform rotate-45 shadow-lg shadow-red-900/50">
                        </div>
                        <div
                          class="absolute h-0.5 w-20 bg-red-600 transform rotate-45 -translate-y-2 shadow-lg shadow-red-900/50">
                        </div>

                        <!-- Deuxième série de griffures (croisant les premières) -->
                        <div
                          class="absolute h-0.5 w-20 bg-red-600 transform -rotate-45 translate-y-2 shadow-lg shadow-red-900/50">
                        </div>
                        <div class="absolute h-0.5 w-20 bg-red-600 transform -rotate-45 shadow-lg shadow-red-900/50">
                        </div>
                        <div
                          class="absolute h-0.5 w-20 bg-red-600 transform -rotate-45 -translate-y-2 shadow-lg shadow-red-900/50">
                        </div>

                        <!-- Gouttes de sang aux extrémités -->
                        <div class="absolute top-3 left-3 w-1 h-1 rounded-full bg-red-600 animate-pulse"></div>
                        <div class="absolute top-3 right-3 w-1 h-1 rounded-full bg-red-600 animate-pulse"></div>
                        <div class="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-red-600 animate-pulse"></div>
                        <div class="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-red-700 animate-pulse"></div>
                      </div>
                    </div>

                    <!-- Nom du joueur -->
                    <span class="mt-2 text-base font-medium" :class="{
                      'text-gray-300': user !== socketStore.username,
                      'text-purple-400': user === socketStore.username,
                      'line-through text-gray-500': deadPlayers.includes(user)
                    }">{{ user }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bouton de chat -->
          <button @click="toggleChat"
            class="absolute bottom-6 right-6 bg-purple-500 hover:bg-purple-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal du chat (s'affiche uniquement quand la partie est lancée et le bouton cliqué) -->
      <div v-if="gameStarted && showChatModal"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-40"
        @click.self="toggleChat">
        <div
          class="backdrop-blur-sm bg-purple-900/10 border border-purple-500/20 rounded-xl w-full max-w-2xl h-3/4 flex flex-col">
          <!-- Entête du chat -->
          <div class="p-4 border-b border-purple-500/20 flex justify-between items-center">
            <h3 class="text-xl font-bold text-purple-400">Chat</h3>
            <button @click="toggleChat" class="text-gray-400 hover:text-gray-200">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Messages -->
          <div class="flex-1 p-6 overflow-y-auto space-y-4" ref="chatBox">
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
          <div class="p-4 border-t border-purple-500/20">
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

      <!-- Transition de phase jour/nuit -->
      <div v-if="showPhaseTransition"
        class="fixed inset-0 flex items-center justify-center z-50 transition-all duration-1000"
        :class="targetPhase === 'night' ? 'bg-black/90 backdrop-blur-md' : 'bg-black/90 backdrop-blur-md'">
        <div class="text-center transform scale-100 opacity-100 transition-all duration-1000 max-w-4xl">
          <div class="flex justify-center mb-8">
            <div v-if="targetPhase === 'night'" class="animate-pulse">
              <svg class="w-24 h-24 text-blue-200" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            </div>
            <div v-else-if="targetPhase === 'vote'" class="animate-pulse">
              <svg class="w-24 h-24 text-purple-200" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.35-.035-.691-.1-1.021A5 5 0 0010 11z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <div v-else-if="targetPhase === 'announce'" class="animate-pulse">
              <svg class="w-24 h-24 text-red-200" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <div v-else class="animate-pulse">
              <svg class="w-24 h-24 text-yellow-200" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div class="text-5xl font-bold mb-4" :class="{
            'text-blue-300': targetPhase === 'night',
            'text-purple-300': targetPhase === 'vote',
            'text-red-300': targetPhase === 'announce',
            'text-yellow-300': targetPhase === 'day'
          }">
            {{ transitionText }}
          </div>
          <p class="text-xl text-gray-300 max-w-xl mx-auto" v-if="targetPhase === 'night'">
            Les loups-garous se réveillent et partent à la chasse...
          </p>
          <p class="text-xl text-gray-300 max-w-xl mx-auto" v-else-if="targetPhase === 'vote'">
            Le village doit désigner un coupable...
          </p>
          <p class="text-xl text-gray-300 max-w-xl mx-auto" v-else-if="targetPhase === 'announce'">
            L'heure du jugement est venue...
          </p>
          <p class="text-xl text-gray-300 max-w-xl mx-auto" v-else>
            Le village se réveille et découvre ce qu'il s'est passé cette nuit...
          </p>
        </div>
      </div>


      <!-- Annonce du résultat du vote -->
      <div v-if="gamePhase === 'announce' && showAnnounceScreen"
        class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-40">
        <div class="text-center max-w-xl">
          <div v-if="dayVictim" class="space-y-8">
            <!-- Annonce de la personne éliminée avec son avatar -->
            <h2 class="text-5xl font-bold text-red-400 mb-6">Élimination</h2>

            <!-- Avatar du mort avec marques de griffures sanglantes -->
            <div class="relative mx-auto w-40 h-40 mb-4">
              <img src="/src/assets/images/roles/avatar_default2.png" alt="Avatar"
                class="w-40 h-40 rounded-full border-4 border-red-600 grayscale opacity-80">

              <!-- Griffures sanglantes -->
              <div class="absolute inset-0 flex items-center justify-center">
                <!-- Première série de griffures (3 traits) -->
                <div
                  class="absolute h-0.5 w-36 bg-red-600 transform rotate-45 translate-y-4 shadow-lg shadow-red-900/50">
                </div>
                <div class="absolute h-0.5 w-36 bg-red-600 transform rotate-45 shadow-lg shadow-red-900/50"></div>
                <div
                  class="absolute h-0.5 w-36 bg-red-600 transform rotate-45 -translate-y-4 shadow-lg shadow-red-900/50">
                </div>

                <!-- Deuxième série de griffures (croisant les premières) -->
                <div
                  class="absolute h-0.5 w-36 bg-red-600 transform -rotate-45 translate-y-4 shadow-lg shadow-red-900/50">
                </div>
                <div class="absolute h-0.5 w-36 bg-red-600 transform -rotate-45 shadow-lg shadow-red-900/50"></div>
                <div
                  class="absolute h-0.5 w-36 bg-red-600 transform -rotate-45 -translate-y-4 shadow-lg shadow-red-900/50">
                </div>

                <!-- Gouttes de sang aux extrémités -->
                <div class="absolute top-6 left-6 w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                <div class="absolute top-6 right-6 w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                <div class="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                <div class="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-red-700 animate-pulse"></div>
              </div>
            </div>

            <!-- Nom du mort -->
            <div class="text-4xl font-bold text-gray-300">
              {{ dayVictim }} a été éliminé par le village!
            </div>

            <!-- Révélation du rôle (avec animation) -->
            <transition enter-active-class="transition duration-1000 transform" enter-from-class="opacity-0 scale-75"
              enter-to-class="opacity-100 scale-100" appear>
              <div v-if="showVictimRole && dayVictimRole" class="mt-10 space-y-4">
                <!-- Titre de la révélation -->
                <h3 class="text-2xl text-gray-400 mb-2">Révélation du rôle</h3>

                <!-- Icône du rôle -->
                <div class="relative inline-block mb-2" v-if="getVictimRoleDetails()">
                  <div class="absolute -inset-2 rounded-full opacity-50" :class="{
                    'bg-red-500/20 animate-pulse': dayVictimRole?.camp === 'Loups-Garous',
                    'bg-blue-500/20 animate-pulse': dayVictimRole?.camp === 'Villageois',
                    'bg-yellow-500/20 animate-pulse': dayVictimRole?.camp === 'Neutre'
                  }"></div>
                  <img :src="getVictimRoleDetails()?.icon" :alt="dayVictimRole?.role"
                    class="w-24 h-24 mx-auto rounded-full border-4 relative" :class="{
                      'border-red-400': dayVictimRole?.camp === 'Loups-Garous',
                      'border-blue-400': dayVictimRole?.camp === 'Villageois',
                      'border-yellow-400': dayVictimRole?.camp === 'Neutre'
                    }">
                </div>

                <!-- Nom du rôle avec animation de texte -->
                <div class="text-3xl font-bold animate-pulse" :class="{
                  'text-red-400': dayVictimRole?.camp === 'Loups-Garous',
                  'text-blue-400': dayVictimRole?.camp === 'Villageois',
                  'text-yellow-400': dayVictimRole?.camp === 'Neutre'
                }">
                  {{ dayVictimRole?.role }}
                </div>

                <!-- Camp du joueur -->
                <div class="mt-2 px-6 py-2 rounded-full inline-block" :class="{
                  'bg-red-500/10 text-red-400': dayVictimRole?.camp === 'Loups-Garous',
                  'bg-blue-500/10 text-blue-400': dayVictimRole?.camp === 'Villageois',
                  'bg-yellow-500/10 text-yellow-400': dayVictimRole?.camp === 'Neutre'
                }">
                  {{ dayVictimRole?.camp }}
                </div>
              </div>
            </transition>

          </div>
          <div v-else class="text-5xl font-bold text-gray-300 mb-6">
            Personne n'a été éliminé.
          </div>

          <!-- Timer -->
          <div class="text-xl text-gray-400 mt-10">
            La nuit va bientôt tomber...
          </div>
          <div class="mt-4 text-lg text-gray-500">
            {{ clientTimer }}s
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
    const showChatModal = ref(false);
    const gamePhase = ref('waiting');
    const phaseTimer = ref(0);
    const showPhaseTransition = ref(false);
    const transitionText = ref('');
    const clientTimer = ref(0);
    const clientTimerInterval = ref(null);
    const votes = ref([]);
    const currentVote = ref(null);
    const dayVictim = ref(null);
    const dayVictimRole = ref(null);
    const deadPlayers = ref([]);
    const showVictimRole = ref(false);
    const showAnnounceScreen = ref(false);
    const targetPhase = ref('waiting');

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

    const roleDetails = computed(() => {
      if (currentPlayerRole.value?.role) {
        return rolesDataJSON[currentPlayerRole.value.role];
      }
      return null;
    });

    // Vérifie si un joueur est un loup-garou
    const isWerewolf = (username) => {
      if (!rolesData.value || !rolesData.value.players) return false;

      const playerData = rolesData.value.players.find(
        player => player.pseudo === username
      );

      return playerData && playerData.camp === 'Loups-Garous';
    };

    // Récupère le rôle d'un joueur
    const getPlayerRole = (username) => {
      if (!rolesData.value || !rolesData.value.players) return null;

      return rolesData.value.players.find(
        player => player.pseudo === username
      );
    };

    // Récupère les détails du rôle d'un joueur
    const getPlayerRoleDetails = (username) => {
      const playerRole = getPlayerRole(username);
      if (!playerRole) return null;

      return rolesDataJSON[playerRole.role];
    };

    // Fonction pour afficher/masquer le chat
    const toggleChat = () => {
      showChatModal.value = !showChatModal.value;
      if (showChatModal.value) {
        nextTick(() => {
          scrollToBottom();
        });
      }
    };

    const voteForPlayer = (player) => {
      if (gamePhase.value !== 'vote') return;
      if (deadPlayers.value.includes(player)) return;
      if (player === socketStore.username) return;

      currentVote.value = player;

      // Envoyer le vote au serveur
      socketStore.socket.emit('castVote', {
        room: props.roomCode,
        voter: socketStore.username,
        votedFor: player
      });
    };

    // Fonction pour compter les votes pour un joueur
    const getVotesForPlayer = (player) => {
      return votes.value.filter(vote => vote.votedFor === player).length;
    };

    // Fonction pour obtenir les détails du rôle de la victime
    const getVictimRoleDetails = () => {
      if (!dayVictimRole.value?.role) return null;
      return rolesDataJSON[dayVictimRole.value.role];
    };

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

              // Si on était en train d'attendre les rôles (loader affiché)
              if (showLoader.value) {
                showLoader.value = false;

                // Afficher la révélation du rôle
                showRoleReveal.value = true;

                // Après la révélation, on affiche l'interface de jeu
                setTimeout(() => {
                  showRoleReveal.value = false;
                  // Interface de jeu affichée
                  gameStarted.value = true;

                  // Signaler au serveur qu'on est prêt pour la phase de nuit
                  socketStore.socket.emit('playerReady', props.roomCode);
                }, 4000);
              }
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

            // Vérifier si on a déjà les rôles (peut arriver si le serveur est rapide)
            if (currentPlayerRole.value) {
              // Révélation du rôle
              showRoleReveal.value = true;

              // Après 4 secondes, cacher la révélation et lancer la partie
              setTimeout(() => {
                showRoleReveal.value = false;

                gameStarted.value = true;

                // Signaler au serveur qu'on est prêt pour la phase de nuit
                // Nouveau message pour dire qu'on est prêt à commencer la phase de jeu
                socketStore.socket.emit('playerReady', props.roomCode);
              }, 4000);
            } else {
              showLoader.value = true;
            }
          }
        }, 1000);
      });

      socketStore.socket.on('phaseChanged', ({ phase, timeLeft, turn, victim, deadPlayers: deadList }) => {
        // Animation de transition
        showPhaseTransition.value = true;

        // Cacher l'écran d'annonce pendant la transition
        showAnnounceScreen.value = false;

        // Stocker la phase cible pour la transition
        targetPhase.value = phase;

        if (phase === 'night') {
          transitionText.value = 'La nuit tombe sur le village...';
        } else if (phase === 'day') {
          transitionText.value = `Le jour se lève sur le village (Jour ${turn})`;
        } else if (phase === 'vote') {
          transitionText.value = 'Le village doit voter!';
        } else if (phase === 'announce') {
          transitionText.value = 'Résultat du vote';

          // Mise à jour de la victime
          if (victim) {
            dayVictim.value = victim;
            // Trouver les informations de la victime
            if (rolesData.value && rolesData.value.players) {
              dayVictimRole.value = rolesData.value.players.find(
                player => player.pseudo === victim
              );

              // Réinitialiser pour l'animation de révélation
              showVictimRole.value = false;
            }
          } else {
            dayVictim.value = null;
            dayVictimRole.value = null;
          }
        }

        // Mise à jour des joueurs morts
        if (deadList) {
          deadPlayers.value = deadList;
        }

        // Après 3 secondes, masque la transition et applique la nouvelle phase
        setTimeout(() => {
          gamePhase.value = phase;
          phaseTimer.value = timeLeft;
          showPhaseTransition.value = false;

          // Afficher l'écran d'annonce seulement après la transition si on est en phase announce
          if (phase === 'announce') {
            showAnnounceScreen.value = true;

            // Programmer l'animation de révélation du rôle
            if (dayVictim.value) {
              setTimeout(() => {
                showVictimRole.value = true;
              }, 2500);
            }
          }

          // Réinitialiser les votes au début d'une nouvelle phase de vote
          if (phase === 'vote') {
            votes.value = [];
            currentVote.value = null;
          }
        }, 3000);
      });

      socketStore.socket.on('voteUpdate', ({ votes: voteList }) => {
        votes.value = voteList;
      });

      socketStore.socket.on('voteError', ({ message }) => {
        error.value = message;
        setTimeout(() => {
          error.value = '';
        }, 3000);
      });

      socketStore.socket.on('timerUpdate', ({ timeLeft, phase }) => {
        // Met à jour le timer serveur
        phaseTimer.value = timeLeft;
        gamePhase.value = phase;

        // Réinitialise le timer client
        clientTimer.value = timeLeft;

        // Nettoie l'intervalle existant si nécessaire
        if (clientTimerInterval.value) {
          clearInterval(clientTimerInterval.value);
        }

        // Démarre un timer local pour une animation fluide
        clientTimerInterval.value = setInterval(() => {
          if (clientTimer.value > 0) {
            clientTimer.value--;
          }
        }, 1000);
      });

      socketStore.socket.on('gameStateUpdate', (gameState) => {
        if (gameState.isRunning) {
          gamePhase.value = gameState.currentPhase;
          phaseTimer.value = gameState.timeLeft;
        }
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

      if (clientTimerInterval.value) {
        clearInterval(clientTimerInterval.value);
      }
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
      showChatModal,
      toggleChat,
      isWerewolf,
      getPlayerRole,
      getPlayerRoleDetails,
      gamePhase,
      phaseTimer,
      showPhaseTransition,
      transitionText,
      clientTimer,
      votes,
      currentVote,
      dayVictim,
      dayVictimRole,
      deadPlayers,
      voteForPlayer,
      getVotesForPlayer,
      showVictimRole,
      getVictimRoleDetails,
      showAnnounceScreen,
      targetPhase,
    };
  },
};
</script>

<style scoped>
@keyframes twinkle {
  0% {
    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.2;
  }
}

.animate-twinkle {
  animation: twinkle 3s ease-in-out infinite;
}
</style>