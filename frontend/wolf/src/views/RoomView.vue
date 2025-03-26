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

          <div class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl">
            <img :src="gamePhase !== 'night'
              ? '/assets/Village_Jour.jpeg'
              : '/assets/Village_Nuit.jpeg'"
              class="min-w-full min-h-full object-cover transform -translate-y-12 rounded-xl"
              alt="Village background" />
          </div>

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
              <div v-if="gamePhase === 'night' && nightPhaseDescription"
                class="absolute top-20 left-0 right-0 mx-auto text-center bg-blue-900/50 backdrop-blur-sm border border-blue-500/40 py-3 px-6 rounded-lg max-w-lg shadow-lg">
                <p class="text-blue-200 font-semibold">{{ nightPhaseDescription }}</p>
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
              <div class="rounded-full relative" style="height: 95%; width: 70%;">

                <!-- Joueurs positionnés en cercle -->
                <div v-for="(user, index) in connectedUsers" :key="user" class="absolute" :style="{
                  top: `${50 + 42 * Math.sin(2 * Math.PI * index / connectedUsers.length)}%`,
                  left: `${50 + 42 * Math.cos(2 * Math.PI * index / connectedUsers.length)}%`,
                  transform: 'translate(-50%, -50%)'
                }">
                  <div class="flex flex-col items-center justify-center">
                    <!-- Avatar avec indication de rôle et possibilité de vote -->
                    <div class="relative">
                      <img src="/assets/avatar_default2.png" alt="Avatar"
                        class="w-20 h-20 rounded-full border-2 transition-transform duration-300" :class="{
                          'border-red-400': isWerewolf(user) && (user === socketStore.username || isWerewolf(socketStore.username)),
                          'border-gray-500': !isWerewolf(user) || (isWerewolf(user) && user !== socketStore.username && !isWerewolf(socketStore.username)),
                          'border-purple-400': user === socketStore.username,
                          'opacity-50 grayscale cursor-not-allowed': deadPlayers.includes(user) || deadPlayers.includes(socketStore.username),
                          'cursor-pointer hover:scale-110 hover:border-white hover:border-opacity-70': gamePhase === 'vote' && !deadPlayers.includes(user) && user !== socketStore.username && !deadPlayers.includes(socketStore.username),
                          'hover:scale-105': gamePhase !== 'vote' && !deadPlayers.includes(user),
                          'border-pink-400 shadow-lg shadow-pink-500/50': cupidSelectionActive && selectedLovers.includes(user),
                          'cursor-pointer hover:scale-110 hover:border-pink-400 hover:border-opacity-70': cupidSelectionActive && !deadPlayers.includes(user)
                        }"
                        @click="gamePhase === 'vote' && !deadPlayers.includes(user) && user !== socketStore.username && !deadPlayers.includes(socketStore.username) ? voteForPlayer(user) : (cupidSelectionActive ? handleCupidSelection(user) : null)">

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

                      <!-- Indicateur de rôle (visible uniquement pour son propre rôle, entre loups ou le couple ) -->
                      <div v-if="user === socketStore.username || (isWerewolf(user) && isWerewolf(socketStore.username)) ||
                        deadPlayers.includes(user) || (isInLove(socketStore.username) && isInLove(user))"
                        class="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-2" :class="{
                          'border-red-400 bg-red-900/50': isWerewolf(user),
                          'border-blue-400 bg-blue-900/50': getPlayerRole(user)?.camp === 'Villageois',
                          'border-yellow-400 bg-yellow-900/50': getPlayerRole(user)?.camp === 'Neutre',
                          'opacity-95': deadPlayers.includes(user)
                        }">
                        <img v-if="getPlayerRoleDetails(user)" :src="getPlayerRoleDetails(user)?.icon"
                          :alt="getPlayerRole(user)?.role" class="w-full h-full rounded-full">
                      </div>

                      <!-- Indicateur du couple (visible uniquement pour le couple et cupidon qui voit son couple )-->
                      <div
                        v-if="isInLove(user) && (isInLove(socketStore.username) || user === socketStore.username || isCupidon())"
                        class="absolute -bottom-2 -left-2 w-8 h-8 rounded-full border-2 border-pink-400 bg-pink-900/50 z-10">
                        <img src="/assets/coeur_rose.png" alt="Amoureux"
                          class="w-full h-full rounded-full animate-pulse">
                      </div>

                      <!-- Badge de séléction des amoureux -->
                      <div v-if="cupidSelectionActive && selectedLovers.includes(user)"
                        class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                        {{ selectedLovers.indexOf(user) + 1 }}
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
                    <span class="mt-2 text-base font-medium drop-shadow-md" :class="{
                      'text-purple-200': user !== socketStore.username,
                      'text-purple-300': user === socketStore.username && gamePhase !== 'night',
                      'text-purple-400': user === socketStore.username && gamePhase === 'night',
                      'line-through text-gray-500': deadPlayers.includes(user)
                    }">{{ user }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="cupidSelectionActive"
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-900/70 backdrop-blur-sm border border-pink-500/40 rounded-xl p-4 z-40 w-full max-w-md shadow-xl">
            <div class="text-center mb-4">
              <img src="/assets/cupidon.png" alt="Cupidon"
                class="w-16 h-16 mx-auto mb-2 border-4 border-pink-400 rounded-full animate-pulse">
              <h3 class="text-xl font-bold text-pink-400">Cupidon</h3>
              <p class="text-gray-300 text-sm">Choisissez deux joueurs pour les lier par l'amour.</p>
              <div class="mt-2 text-pink-300">
                <span>Temps restant: {{ clientTimer }}s</span>
              </div>
            </div>

            <!-- Notification -->
            <div v-if="cupidNotification" class="text-center mb-4">
              <div class="px-3 py-2 rounded-lg inline-block"
                :class="selectedLovers.length === 2 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'">
                {{ cupidNotification }}
              </div>
            </div>

            <div class="flex justify-center gap-4">
              <button @click="confirmCupidSelection"
                class="px-5 py-2 rounded-full font-semibold transition-all hover:scale-105" :class="{
                  'bg-pink-500/30 text-pink-200 cursor-not-allowed': selectedLovers.length !== 2,
                  'bg-pink-500/70 text-pink-100 hover:bg-pink-500/90': selectedLovers.length === 2
                }" :disabled="selectedLovers.length !== 2">
                Confirmer
              </button>
              <button @click="cancelCupidSelection"
                class="px-5 py-2 bg-gray-700/50 text-gray-300 rounded-full transition-all hover:bg-gray-700/70 hover:scale-105">
                Annuler
              </button>
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
      <div v-if="gamePhase === 'announce' && showAnnounceScreen && dayVictim"
        class="fixed inset-0 overflow-hidden flex items-center justify-center p-4 z-40 transition-opacity duration-300"
        :class="[
          { 'opacity-100': showAnnounceScreen, 'opacity-0 pointer-events-none': !showAnnounceScreen },
          {
            'bg-black/95': animationStage < 7,
            'bg-red-950/95': animationStage >= 7 && dayVictimRole?.camp === 'Loups-Garous',
            'bg-blue-950/95': animationStage >= 7 && dayVictimRole?.camp === 'Villageois',
            'bg-yellow-950/95': animationStage >= 7 && dayVictimRole?.camp === 'Neutre'
          }
        ]">

        <!-- Brume/brouillard qui se répand -->
        <div class="fixed inset-0 pointer-events-none">
          <div v-for="i in 10" :key="`fog-${i}`" class="absolute opacity-0 fog-particle"
            :class="{ 'animate-fog': animationStage >= 2 }" :style="{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              animationDelay: `${Math.random() * 1}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              filter: `blur(${Math.random() * 10 + 5}px)`
            }">
          </div>
        </div>

        <!-- Gouttes de sang qui tombent -->
        <div v-if="animationStage >= 3" class="fixed inset-0 pointer-events-none overflow-hidden">
          <div v-for="i in 20" :key="`blood-${i}`"
            class="absolute w-1 h-6 bg-red-600 rounded-full animate-blood-drip opacity-0" :style="{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 15 + 5}px`,
              animationDelay: `${Math.random() * 3}s`
            }">
          </div>
        </div>

        <!-- Éclairs rouges simulant des battements de cœur -->
        <div v-if="animationStage >= 1" class="fixed inset-0 pointer-events-none bg-red-900/0 heartbeat-flash"></div>

        <!-- Conteneur central pour l'animation -->
        <div class="relative z-10 transform max-w-xl w-full" :class="[
          { 'scale-100': animationStage >= 1, 'scale-0': animationStage < 1 },
          { 'animate-screen-shake': animationStage >= 4 }
        ]">

          <!-- Titre qui apparaît par le haut -->
          <h2 class="text-5xl font-bold mb-10 text-center title-slide-in" :class="[
            { 'opacity-0': animationStage < 1, 'opacity-100': animationStage >= 1 },
            {
              'text-red-400': dayVictimRole?.camp === 'Loups-Garous',
              'text-blue-400': dayVictimRole?.camp === 'Villageois',
              'text-yellow-400': dayVictimRole?.camp === 'Neutre',
              'text-red-400': !dayVictimRole
            }
          ]">Élimination</h2>

          <!-- Citation thématique -->
          <div v-if="animationStage >= 2"
            class="text-center mb-8 opacity-0 animate-fade-in italic text-gray-400 quote-text">
            "{{ getThematicQuote(dayVictimRole?.role) }}"
          </div>

          <!-- Narratif dramatique -->
          <div v-if="animationStage >= 3"
            class="text-center mb-6 text-xl text-gray-300 narrative-text opacity-0 animate-fade-in">
            Le village découvre avec horreur que...
          </div>

          <!-- Avatar container avec fissures -->
          <div class="relative mx-auto mb-4" :class="{
            'w-40 h-40': animationStage < 5,
            'w-40 h-40 transition-all duration-1000': animationStage >= 5,
            'avatar-pulse': animationStage >= 1
          }">

            <!-- Avatar qui se transforme -->
            <div class="relative w-full h-full">
              <!-- Avatar original -->
              <img src="/assets/avatar_default2.png" :alt="dayVictim"
                class="w-full h-full object-cover rounded-full transition-all duration-500" :class="{
                  'grayscale': animationStage >= 2,
                  'blur-sm': animationStage === 6,
                  'opacity-0': animationStage >= 7,
                  'border-4 border-red-600': animationStage >= 2,
                  'transform scale-110': animationStage === 1
                }">

              <!-- Morphing vers l'icône du rôle -->
              <img v-if="getVictimRoleDetails() && animationStage >= 6" :src="getVictimRoleDetails()?.icon"
                :alt="dayVictimRole?.role"
                class="absolute inset-0 w-full h-full object-cover rounded-full transition-all duration-1000" :class="{
                  'opacity-0 transform scale-50': animationStage === 6,
                  'opacity-100 transform scale-100': animationStage >= 7,
                }">
            </div>

            <!-- Fissures qui se propagent depuis l'avatar -->
            <template v-if="animationStage >= 4">
              <div v-for="i in 8" :key="`crack-${i}`" class="absolute bg-red-600 opacity-0 crack-line" :style="{
                width: '3px',
                height: `${Math.random() * 150 + 50}px`,
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 45}deg) translateY(-50%)`,
                transformOrigin: 'top',
                animationDelay: `${i * 0.1}s`
              }">
              </div>
            </template>
          </div>

          <!-- Nom de la victime et annonce -->
          <div class="text-center text-fade-in"
            :class="{ 'opacity-0': animationStage < 3, 'opacity-100': animationStage >= 3 }">
            <div class="text-4xl font-bold text-gray-300 mb-6">
              {{ dayVictim }} a été éliminé par le village!
            </div>
          </div>

          <!-- Carte de Tarot qui se retourne -->
          <div v-if="animationStage >= 5" class="relative mx-auto mt-10 perspective-container">
            <div class="tarot-card" :class="{ 'card-flip': animationStage >= 6 }">
              <!-- Face avant (dos de la carte) -->
              <div class="tarot-card-front">
                <div
                  class="w-64 h-96 rounded-lg bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-gray-300/30 flex items-center justify-center">
                  <div class="text-center p-4">
                    <div
                      class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/80 border border-gray-300/30 flex items-center justify-center">
                      <div class="text-purple-300 text-5xl">?</div>
                    </div>
                    <div class="text-gray-300 text-xl">Révélation</div>
                    <div class="text-gray-400 text-sm mt-2">Le destin se dévoile...</div>
                  </div>
                </div>
              </div>

              <!-- Face arrière (rôle révélé) -->
              <div class="tarot-card-back">
                <div class="w-64 h-96 rounded-lg flex flex-col items-center justify-center p-4" :class="{
                  'bg-gradient-to-br from-red-950 to-red-800 border-2 border-red-500/30': dayVictimRole?.camp === 'Loups-Garous',
                  'bg-gradient-to-br from-blue-950 to-blue-800 border-2 border-blue-500/30': dayVictimRole?.camp === 'Villageois',
                  'bg-gradient-to-br from-yellow-950 to-yellow-900 border-2 border-yellow-500/30': dayVictimRole?.camp === 'Neutre'
                }">

                  <!-- Contenu de la carte retournée -->
                  <div v-if="getVictimRoleDetails()" class="text-center">
                    <!-- Icône du rôle -->
                    <div class="relative inline-block mb-4 w-20 h-20">
                      <div class="absolute -inset-1 rounded-full opacity-50" :class="{
                        'bg-red-500/20 animate-pulse': dayVictimRole?.camp === 'Loups-Garous',
                        'bg-blue-500/20 animate-pulse': dayVictimRole?.camp === 'Villageois',
                        'bg-yellow-500/20 animate-pulse': dayVictimRole?.camp === 'Neutre'
                      }">
                      </div>
                      <img :src="getVictimRoleDetails()?.icon" :alt="dayVictimRole?.role"
                        class="w-full h-full rounded-full border-2 relative object-cover" :class="{
                          'border-red-400': dayVictimRole?.camp === 'Loups-Garous',
                          'border-blue-400': dayVictimRole?.camp === 'Villageois',
                          'border-yellow-400': dayVictimRole?.camp === 'Neutre'
                        }">
                    </div>

                    <!-- Titre du rôle -->
                    <div class="text-2xl font-bold mb-2" :class="{
                      'text-red-300': dayVictimRole?.camp === 'Loups-Garous',
                      'text-blue-300': dayVictimRole?.camp === 'Villageois',
                      'text-yellow-300': dayVictimRole?.camp === 'Neutre'
                    }">
                      {{ dayVictimRole?.role }}
                    </div>

                    <!-- Camp -->
                    <div class="mt-2 px-4 py-1 rounded-full inline-block text-sm" :class="{
                      'bg-red-500/10 text-red-300': dayVictimRole?.camp === 'Loups-Garous',
                      'bg-blue-500/10 text-blue-300': dayVictimRole?.camp === 'Villageois',
                      'bg-yellow-500/10 text-yellow-300': dayVictimRole?.camp === 'Neutre'
                    }">
                      {{ dayVictimRole?.camp }}
                    </div>

                    <!-- Description -->
                    <div class="mt-4 text-sm text-gray-300">
                      {{ getVictimRoleDetails()?.description_courte }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timer -->
          <div v-if="animationStage >= 7" class="mt-10 text-center text-fade-in opacity-0 animate-fade-in">
            <div class="text-xl text-gray-400">
              La nuit va bientôt tomber...
            </div>
            <div class="mt-2 text-lg text-gray-500">
              {{ clientTimer }}s
            </div>
          </div>
        </div>
      </div>

      <div v-if="gamePhase === 'announce' && showAnnounceScreen && !dayVictim"
        class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-40 transition-opacity duration-300"
        :class="{ 'opacity-100': showAnnounceScreen, 'opacity-0 pointer-events-none': !showAnnounceScreen }">
        <div class="text-center max-w-xl">
          <div class="text-5xl font-bold text-blue-400 mb-6 animate-pulse">
            <svg class="w-24 h-24 mx-auto mb-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Aucune élimination
          </div>
          <div class="text-2xl text-gray-300 mb-10">
            Le village n'a pas réussi à se mettre d'accord.
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

    <RoleSelectionModal v-if="showRoleSelectionModal" :show="showRoleSelectionModal"
      :player-count="connectedUsers.length" @close="showRoleSelectionModal = false"
      @start-game-auto="startGameWithAutoBalance" @start-game-manual="startGameWithManualRoles" />

    <div v-if="showLoverDeathAnimation"
      class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      :class="{ 'opacity-100': showLoverDeathAnimation, 'opacity-0': !showLoverDeathAnimation }">
      <div class="text-center max-w-xl">
        <div class="space-y-8 transform transition-all duration-700 ease-out"
          :class="{ 'opacity-100 translate-y-0': showLoverDeathAnimation, 'opacity-0 translate-y-10': !showLoverDeathAnimation }">
          <h2 class="text-5xl font-bold text-pink-400 mb-6">Mort par chagrin</h2>

          <!-- Animation du coeur brisé -->
          <div class="relative mx-auto w-40 h-40 mb-4">
            <img src="/assets/avatar_default2.png" :alt="loverVictim"
              class="w-40 h-40 rounded-full border-4 border-pink-400 opacity-80 transition-all duration-500"
              :class="{ 'grayscale': loverHeartbreakStep >= 1 }">

            <!-- Coeur brisé -->
            <div class="absolute inset-0 flex items-center justify-center">
              <img src="/assets/coeur_rose.png" alt="Coeur brisé" class="w-32 h-32 transition-all duration-1000"
                :class="{ 'scale-0 opacity-0': loverHeartbreakStep >= 1, 'scale-110': loverHeartbreakStep === 0 }">
            </div>
          </div>

          <!-- Nom de l'amoureux -->
          <div class="text-4xl font-bold text-gray-300">
            {{ loverVictim }} est mort(e) de chagrin!
          </div>

          <!-- Révélation du rôle -->
          <transition enter-active-class="transition duration-1000 transform" enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100" appear>
            <div v-if="loverHeartbreakStep >= 2" class="mt-10 space-y-4">
              <!-- Titre de la révélation -->
              <h3 class="text-2xl text-gray-400 mb-2">Révélation du rôle</h3>

              <!-- Icône du rôle -->
              <div v-if="loverRoleDetails" class="relative inline-block mb-2">
                <div class="absolute -inset-2 rounded-full opacity-50" :class="{
                  'bg-red-500/20 animate-pulse': loverVictimRole?.camp === 'Loups-Garous',
                  'bg-blue-500/20 animate-pulse': loverVictimRole?.camp === 'Villageois',
                  'bg-yellow-500/20 animate-pulse': loverVictimRole?.camp === 'Neutre'
                }"></div>
                <img :src="loverRoleDetails.icon" :alt="loverVictimRole?.role"
                  class="w-24 h-24 mx-auto rounded-full border-4 relative" :class="{
                    'border-red-400': loverVictimRole?.camp === 'Loups-Garous',
                    'border-blue-400': loverVictimRole?.camp === 'Villageois',
                    'border-yellow-400': loverVictimRole?.camp === 'Neutre'
                  }">
              </div>

              <!-- Nom du rôle avec animation de texte -->
              <div class="text-3xl font-bold animate-pulse" :class="{
                'text-red-400': loverVictimRole?.camp === 'Loups-Garous',
                'text-blue-400': loverVictimRole?.camp === 'Villageois',
                'text-yellow-400': loverVictimRole?.camp === 'Neutre'
              }">
                {{ loverVictimRole?.role }}
              </div>

              <!-- Camp du joueur -->
              <div class="mt-2 px-6 py-2 rounded-full inline-block" :class="{
                'bg-red-500/10 text-red-400': loverVictimRole?.camp === 'Loups-Garous',
                'bg-blue-500/10 text-blue-400': loverVictimRole?.camp === 'Villageois',
                'bg-yellow-500/10 text-yellow-400': loverVictimRole?.camp === 'Neutre'
              }">
                {{ loverVictimRole?.camp }}
              </div>
            </div>
          </transition>

          <!-- Timer pour fermeture automatique -->
          <div v-if="loverDeathCloseTimer > 0" class="mt-8 text-gray-400 text-sm">
            Ce message se fermera dans {{ loverDeathCloseTimer }}s
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useSocketStore } from "../stores/socket";
import { rolesDataJSON } from '@/data/rolesData';
import RoleDetailModal from '@/components/RoleDetailModal.vue';
import RoleSelectionModal from '@/components/RoleSelectionModal.vue';
import CupidActionModal from '@/components/CupidActionModal.vue';
import LoverDeathModal from '@/components/LoverDeathModal.vue';

export default {
  components: {
    RoleDetailModal,
    RoleSelectionModal,
    CupidActionModal,
    LoverDeathModal,
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
    const showRoleSelectionModal = ref(false);
    const showCupidModal = ref(false);
    const lovers = ref(null);
    const myLover = ref(null);
    const loverVictim = ref(null);
    const loverVictimRole = ref(null);
    const currentNightSubPhase = ref('');
    const cupidSelectionActive = ref(false);
    const selectedLovers = ref([]);
    const cupidNotification = ref('');
    const showLoverDeathAnimation = ref(false);
    const loverHeartbreakStep = ref(0);
    const loverDeathCloseTimer = ref(0);
    let loverDeathTimerInterval = null;
    const pendingLoverDeath = ref(false);
    const animationStage = ref(0);
    let animationTimer = null;


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
        showRoleSelectionModal.value = true;
      }
    };

    const startGameWithAutoBalance = () => {
      showRoleSelectionModal.value = false;
      socketStore.socket.emit("startGame", props.roomCode, "auto");
    };

    const startGameWithManualRoles = (selectedRoles) => {
      showRoleSelectionModal.value = false;
      socketStore.socket.emit("startGame", props.roomCode, "manual", selectedRoles);
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

    const loverRoleDetails = computed(() => {
      if (loverVictimRole.value?.role) {
        return rolesDataJSON[loverVictimRole.value.role];
      }
      return null;
    });

    // Vérifier si un joueur est amoureux
    const isInLove = (username) => {
      return lovers.value && (lovers.value[0] === username || lovers.value[1] === username);
    };

    const submitCupidAction = (selectedLovers) => {
      socketStore.socket.emit('cupidAction', {
        room: props.roomCode,
        lovers: selectedLovers
      });

      showCupidModal.value = false;
    };

    const areLovers = (player1, player2) => {
      return lovers.value &&
        ((lovers.value[0] === player1 && lovers.value[1] === player2) ||
          (lovers.value[0] === player2 && lovers.value[1] === player1));
    };

    const nightPhaseDescription = computed(() => {
      if (gamePhase.value !== 'night') return '';

      switch (currentNightSubPhase.value) {
        case 'cupidon':
          return "Cupidon se réveille et désigne les deux amoureux...";
        case 'loup-garou':
          return "Les loups-garous se réveillent et choisissent leur victime...";
        case 'voyante':
          return "La voyante se réveille et consulte les astres...";
        case 'sorcière':
          return "La sorcière se réveille et prépare ses potions...";
        case 'salvateur':
          return "Le salvateur se réveille et protège un villageois...";
        case 'renard':
          return "Le renard se réveille et flaire les traces des loups...";
        case 'corbeau':
          return "Le corbeau se réveille et désigne sa cible...";
        case 'infect père des loups':
          return "L'infect père des loups se réveille et rôde dans le village...";
        case 'joueur de flûte':
          return "Le joueur de flûte se réveille et enchante les habitants...";
        default:
          return "Les créatures de la nuit sont à l'œuvre...";
      }
    });

    const isCupidon = () => {
      if (!currentPlayerRole.value) return false;
      return currentPlayerRole.value.role === 'Cupidon';
    };

    const startCupidSelection = () => {
      // Réinitialiser la sélection
      selectedLovers.value = [];
      cupidNotification.value = '';
      cupidSelectionActive.value = true;
    };

    const handleCupidSelection = (player) => {
      // Ne rien faire si ce n'est pas le mode sélection de Cupidon
      if (!cupidSelectionActive.value) return;

      // Ne pas permettre de sélectionner un joueur mort
      if (deadPlayers.value.includes(player)) return;

      // Vérifier si le joueur est déjà sélectionné
      if (selectedLovers.value.includes(player)) {
        // Le retirer de la sélection
        selectedLovers.value = selectedLovers.value.filter(selected => selected !== player);
        cupidNotification.value = '';
      } else {
        // Vérifier si on a déjà sélectionné 2 joueurs
        if (selectedLovers.value.length >= 2) {
          cupidNotification.value = 'Vous ne pouvez sélectionner que 2 joueurs';
          return;
        }

        // Ajouter le joueur à la sélection
        selectedLovers.value.push(player);

        // Afficher un message si 2 joueurs sont sélectionnés
        if (selectedLovers.value.length === 2) {
          cupidNotification.value = 'Amoureux sélectionnés ! Confirmez votre choix';
        }
      }
    };

    // Fonction pour confirmer la sélection des amoureux
    const confirmCupidSelection = () => {
      if (selectedLovers.value.length !== 2) {
        cupidNotification.value = 'Vous devez sélectionner exactement 2 joueurs';
        return;
      }

      // Envoyer au serveur
      socketStore.socket.emit('cupidAction', {
        room: props.roomCode,
        lovers: selectedLovers.value
      });

      // Désactiver le mode sélection
      cupidSelectionActive.value = false;
    };

    // Fonction pour annuler la sélection
    const cancelCupidSelection = () => {
      selectedLovers.value = [];
      cupidSelectionActive.value = false;
    };

    const notifyAnimationCompleted = (animationId) => {
      socketStore.socket.emit('animationCompleted', {
        animationId,
        room: props.roomCode
      });
    };

    const startLoverDeathAnimation = () => {
      // Vérifier qu'on a bien les infos nécessaires
      if (!loverVictim.value || !loverVictimRole.value) return;

      // S'assurer que l'écran d'annonce précédent est masqué
      showAnnounceScreen.value = false;

      // Réinitialiser l'état de l'animation
      loverHeartbreakStep.value = 0;

      // Afficher l'animation
      showLoverDeathAnimation.value = true;

      // Séquence d'animation: d'abord le cœur qui se brise
      setTimeout(() => {
        loverHeartbreakStep.value = 1;

        // Puis révéler le rôle
        setTimeout(() => {
          loverHeartbreakStep.value = 2;

          // Démarrer le timer de fermeture automatique (réduit à 5 secondes)
          loverDeathCloseTimer.value = 5;
          loverDeathTimerInterval = setInterval(() => {
            loverDeathCloseTimer.value--;
            if (loverDeathCloseTimer.value <= 0) {
              clearInterval(loverDeathTimerInterval);
              closeLoverDeathAnimation();
            }
          }, 1000);
        }, 1500);
      }, 1500);
    };

    const closeLoverDeathAnimation = () => {
      showLoverDeathAnimation.value = false;
      loverHeartbreakStep.value = 0;

      // Nettoyer l'intervalle s'il existe
      if (loverDeathTimerInterval) {
        clearInterval(loverDeathTimerInterval);
        loverDeathTimerInterval = null;
      }

      // Réinitialiser les variables
      loverVictim.value = null;
      loverVictimRole.value = null;
      pendingLoverDeath.value = false;

      // Informer le serveur que l'animation est terminée
      socketStore.socket.emit('animationCompleted', {
        animationId: 'loverDeath',
        room: props.roomCode
      });
    };

    // Fonction pour obtenir une citation thématique selon le rôle
    const getThematicQuote = (roleName) => {
      const quotes = {
        'Loup-Garou': "La lune révèle à présent ce que l'obscurité dissimulait.",
        'Voyante': "Les étoiles avaient prédit ce destin funeste.",
        'Sorcière': "Les herbes et potions ne peuvent plus rien pour celui qui s'en va.",
        'Cupidon': "Même l'amour ne peut triompher de la mort.",
        'Chasseur': "Le chasseur est devenu la proie.",
        'Villageois': "Un innocent de plus succombe à la peur collective.",
        'Joueur de Flûte': "Sa mélodie résonnera à jamais dans le silence.",
        'Corbeau': "Les présages sombres ne mentent jamais.",
        'Ancien': "Sa sagesse sera à jamais perdue.",
        'Bouc Émissaire': "Le sacrifice d'un innocent n'apaise pas les peurs.",
        'Salvateur': "Celui qui protégeait les autres n'a pu se sauver lui-même.",
        'Infect Père des Loups': "Même les créatures les plus redoutables connaissent la fin.",
        'Renard': "La ruse ne suffit pas toujours à échapper au destin."
      };

      return quotes[roleName] || "Le village ne sera plus jamais le même...";
    };

    // Fonction pour gérer l'animation d'annonce de mort
    const startDeathAnimation = () => {
      // Réinitialiser l'animation
      animationStage.value = 0;

      // Nettoyer le timer précédent si existant
      if (animationTimer) {
        clearTimeout(animationTimer);
      }

      // Séquence d'animation
      const sequence = [
        { stage: 1, delay: 500 },    // Zoom sur avatar + battements
        { stage: 2, delay: 1000 },   // Brume + grayscale
        { stage: 3, delay: 1000 },   // Gouttes de sang + texte
        { stage: 4, delay: 1000 },   // Fissures + tremblement
        { stage: 5, delay: 1000 },   // Apparition carte de tarot
        { stage: 6, delay: 1500 },   // Flou et début morph
        { stage: 7, delay: 1000 },   // Retournement carte + couleur fond
        { stage: 8, delay: 1000 }    // Timer
      ];

      // Exécuter la séquence
      let cumulativeDelay = 0;

      sequence.forEach(step => {
        cumulativeDelay += step.delay;

        setTimeout(() => {
          animationStage.value = step.stage;

          // Dernière étape - attendre le timer pour la prochaine phase
          if (step.stage === sequence.length) {
            // Le timer est déjà géré par le serveur
          }
        }, cumulativeDelay);
      });
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
            pendingLoverDeath.value = false;

            // Démarrer l'animation d'annonce de mort si un joueur est mort
            if (dayVictim.value) {
              startDeathAnimation();
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

      socketStore.socket.on('timerUpdate', ({ timeLeft, phase, subPhase }) => {
        // Met à jour le timer serveur
        phaseTimer.value = timeLeft;
        gamePhase.value = phase;

        // Mettre à jour la sous-phase de nuit si présente
        if (subPhase) {
          currentNightSubPhase.value = subPhase;
        }

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
          } else if (phase === 'announce' && pendingLoverDeath.value && !showLoverDeathAnimation.value) {
            // Quand le timer arrive à 0 :
            // 1. D'abord, on cache l'écran d'annonce de la première mort
            showAnnounceScreen.value = false;

            // 2. Petit délai pour s'assurer que l'animation précédente est bien terminée
            setTimeout(() => {
              // 3. Ensuite on affiche l'animation de mort par chagrin
              startLoverDeathAnimation();
            }, 50); // Un court délai est suffisant
          }
        }, 1000);
      });

      socketStore.socket.on('gameStateUpdate', (gameState) => {
        if (gameState.isRunning) {
          gamePhase.value = gameState.currentPhase;
          phaseTimer.value = gameState.timeLeft;
        }
      });

      socketStore.socket.on('loversAnnounce', ({ lovers: coupleLovers }) => {
        lovers.value = coupleLovers;

        // Si le joueur actuel est un des amoureux, stocker qui est son amoureux
        if (socketStore.username === coupleLovers[0]) {
          myLover.value = coupleLovers[1];
        } else if (socketStore.username === coupleLovers[1]) {
          myLover.value = coupleLovers[0];
        }
      });

      socketStore.socket.on('loverDeath', ({ victim, lover, loverRole, deadPlayers: updatedDeadPlayers }) => {
        // Mettre à jour la liste des morts
        deadPlayers.value = updatedDeadPlayers;

        // Stocke les infos pour l'animation qui sera lancée plus tard
        loverVictim.value = lover;
        loverVictimRole.value = loverRole;
        pendingLoverDeath.value = true;
      });

      socketStore.socket.on('waitForLoverDeath', ({ expectedDuration }) => {
        // Marquer qu'on attend une animation de mort par chagrin
        pendingLoverDeath.value = true;

        // Failsafe: Si l'animation n'est pas lancée après un certain temps, envoyer quand même l'événement de fin
        setTimeout(() => {
          if (pendingLoverDeath.value && !showLoverDeathAnimation.value) {
            socketStore.socket.emit('animationCompleted', {
              animationId: 'loverDeath',
              room: props.roomCode
            });
          }
        }, expectedDuration + 2000); // Ajouter 2 secondes de marge
      });

      socketStore.socket.on('cupidActionCompleted', () => {
        // Notifier que l'action de Cupidon a été complétée
        showCupidModal.value = false;
      });

      socketStore.socket.on('actionError', ({ message }) => {
        error.value = message;
        setTimeout(() => {
          error.value = '';
        }, 3000);
      });

      socketStore.socket.on('nightActionRequired', ({ role, player, timeLeft }) => {
        // Si c'est l'action de Cupidon et que le joueur est le joueur actuel
        if (role === 'Cupidon' && player === socketStore.username) {
          clientTimer.value = timeLeft;
          // Utiliser uniquement l'interface intégrée, pas le modal
          startCupidSelection();

          // Timer pour fermer automatiquement après le temps imparti
          setTimeout(() => {
            if (cupidSelectionActive.value) {
              // Si le joueur n'a pas confirmé, on annule
              cancelCupidSelection();
            }
          }, timeLeft * 1000);
        }
        // ... gérer les autres rôles si nécessaire
      });

      socketStore.socket.on('cupidActionCompleted', () => {
        cupidSelectionActive.value = false;
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
      socketStore.socket.off('nightActionRequired');
      socketStore.socket.off('loversAnnounce');
      socketStore.socket.off('loverDeath');
      socketStore.socket.off('cupidActionCompleted');
      socketStore.socket.off('actionError');
      socketStore.socket.off('waitForLoverDeath');

      if (clientTimerInterval.value) {
        clearInterval(clientTimerInterval.value);
      }

      if (loverDeathTimerInterval) {
        clearInterval(loverDeathTimerInterval);
      }

      if (animationTimer) {
        clearTimeout(animationTimer);
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
      showRoleSelectionModal,
      startGameWithAutoBalance,
      startGameWithManualRoles,
      showCupidModal,
      lovers,
      myLover,
      loverVictim,
      loverVictimRole,
      loverRoleDetails,
      isInLove,
      submitCupidAction,
      currentNightSubPhase,
      nightPhaseDescription,
      isCupidon,
      cupidSelectionActive,
      selectedLovers,
      cupidNotification,
      handleCupidSelection,
      confirmCupidSelection,
      cancelCupidSelection,
      showLoverDeathAnimation,
      loverHeartbreakStep,
      loverDeathCloseTimer,
      startLoverDeathAnimation,
      closeLoverDeathAnimation,
      showAnnounceScreen,
      pendingLoverDeath,
      animationStage,
      getThematicQuote,
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

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Animation de pulsation pour l'avatar */
@keyframes avatarPulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.avatar-pulse {
  animation: avatarPulse 0.8s ease-in-out infinite;
}

/* Animation de battement de cœur avec flash rouge */
@keyframes heartbeatFlash {

  0%,
  100% {
    background-color: rgba(127, 29, 29, 0);
  }

  50% {
    background-color: rgba(127, 29, 29, 0.3);
  }
}

.heartbeat-flash {
  animation: heartbeatFlash 0.8s ease-in-out infinite;
}

/* Animation pour l'apparition des fissures */
@keyframes crackGrow {
  0% {
    opacity: 0;
    height: 0;
  }

  100% {
    opacity: 0.7;
    height: 200px;
  }
}

.crack-line {
  animation: crackGrow 1.5s ease-out forwards;
}

/* Animation pour les gouttes de sang */
@keyframes bloodDrip {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }

  10% {
    opacity: 0.8;
  }

  100% {
    opacity: 0;
    transform: translateY(120vh);
  }
}

.animate-blood-drip {
  animation: bloodDrip 4s ease-in forwards;
}

/* Animation pour les particules de brouillard */
@keyframes fogExpand {
  0% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }

  50% {
    opacity: 0.3;
  }

  100% {
    opacity: 0;
    transform: scale(2) rotate(45deg);
  }
}

.fog-particle {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0) 70%);
  border-radius: 50%;
}

.animate-fog {
  animation: fogExpand 5s ease-out forwards;
}

/* Animation de tremblement d'écran */
@keyframes screenShake {

  0%,
  100% {
    transform: translate(0, 0);
  }

  10% {
    transform: translate(-5px, -5px);
  }

  20% {
    transform: translate(5px, 5px);
  }

  30% {
    transform: translate(-3px, 3px);
  }

  40% {
    transform: translate(3px, -3px);
  }

  50% {
    transform: translate(-2px, -2px);
  }

  60% {
    transform: translate(2px, 2px);
  }

  70% {
    transform: translate(-1px, 1px);
  }

  80% {
    transform: translate(1px, -1px);
  }

  90% {
    transform: translate(-1px, -1px);
  }
}

.animate-screen-shake {
  animation: screenShake 0.5s ease-in-out;
}

/* Animation pour l'entrée du titre */
@keyframes titleSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-50px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.title-slide-in {
  animation: titleSlideIn 1s ease-out forwards;
}

/* Animation de fondu pour le texte */
@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.text-fade-in {
  transition: opacity 1s ease-out;
}

.animate-fade-in {
  animation: fadeIn 1.5s ease-out forwards;
}

/* Style pour la carte de tarot */
.perspective-container {
  perspective: 1000px;
  width: 64px;
  height: 96px;
  margin: 0 auto;
  transform: scale(1);
}

.tarot-card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tarot-card-front,
.tarot-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.tarot-card-back {
  transform: rotateY(180deg);
}

.card-flip {
  transform: rotateY(180deg);
}

/* Animation pour le texte narratif */
.narrative-text {
  position: relative;
  overflow: hidden;
}

.quote-text {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 0.5px;
  line-height: 1.6;
}
</style>