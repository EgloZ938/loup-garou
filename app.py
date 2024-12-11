from flask import Flask, render_template
from flask_socketio import SocketIO
from dotenv import load_dotenv
import os
from server import init_socketio

# Charge les variables d'environnement
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')
socketio = SocketIO(app, async_mode='gevent', cors_allowed_origins="*")

# Initialise les handlers Socket.IO
init_socketio(socketio)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/game/<room_id>')
def game(room_id):
    # Cette route sera implémentée plus tard
    return f"Room {room_id}"

if __name__ == '__main__':
    socketio.run(app, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')