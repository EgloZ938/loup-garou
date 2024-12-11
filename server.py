from flask import request
from flask_socketio import emit, join_room, leave_room
import random

class GameRoom:
    def __init__(self, room_id):
        self.room_id = room_id
        self.players = {}  # {sid: username}
        self.max_players = 16

    def add_player(self, sid, username):
        if len(self.players) >= self.max_players:
            return False
        self.players[sid] = username
        return True

    def remove_player(self, sid):
        if sid in self.players:
            del self.players[sid]

    def get_players_info(self):
        return {
            'player_count': len(self.players),
            'max_players': self.max_players,
            'players': list(self.players.values())
        }

class GameManager:
    def __init__(self):
        self.rooms = {}  # {room_id: GameRoom}

    def create_room(self):
        room_id = str(random.randint(1000, 9999))
        while room_id in self.rooms:
            room_id = str(random.randint(1000, 9999))
        self.rooms[room_id] = GameRoom(room_id)
        return room_id

    def get_room(self, room_id):
        return self.rooms.get(room_id)

game_manager = GameManager()

def init_socketio(socketio):
    @socketio.on('create_room')
    def handle_create_room(data):
        try:
            username = data['username']
            room_id = game_manager.create_room()
            room = game_manager.get_room(room_id)
            
            if room.add_player(request.sid, username):
                join_room(room_id)
                emit('room_created', {
                    'room_id': room_id,
                    'players_info': room.get_players_info()
                })
            else:
                emit('error', {'message': "Impossible de créer la room"})
            
        except Exception as e:
            emit('error', {'message': str(e)})

    @socketio.on('join_room')
    def handle_join_room(data):
        try:
            room_id = data['room_id']
            username = data['username']
            
            room = game_manager.get_room(room_id)
            if not room:
                emit('error', {'message': "Cette room n'existe pas"})
                return
            
            if room.add_player(request.sid, username):
                join_room(room_id)
                emit('room_joined', {
                    'room_id': room_id,
                    'players_info': room.get_players_info()
                })
            else:
                emit('error', {'message': "La room est pleine"})
            
        except Exception as e:
            emit('error', {'message': str(e)})

    @socketio.on('disconnect')
    def handle_disconnect():
        for room in game_manager.rooms.values():
            if request.sid in room.players:
                room.remove_player(request.sid)