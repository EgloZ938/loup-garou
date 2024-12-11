import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

export default function Home() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [roomId, setRoomId] = useState('')
    const [error, setError] = useState('')

    const createGame = () => {
        if (!username) {
            setError('Veuillez entrer un nom d\'utilisateur')
            return
        }
        localStorage.setItem('username', username)
        socket.emit('create_room', { username })
    }

    const joinGame = () => {
        if (!username || !roomId) {
            setError('Veuillez remplir tous les champs')
            return
        }
        localStorage.setItem('username', username)
        socket.emit('join_room', { username, roomId })
    }

    // Socket event listeners
    socket.on('room_created', (data) => {
        navigate(`/game/${data.roomId}`)
    })

    socket.on('room_joined', (data) => {
        navigate(`/game/${data.roomId}`)
    })

    socket.on('error', (data) => {
        setError(data.message)
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Loup-Garou</h1>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                            ID Room (pour rejoindre)
                        </label>
                        <input
                            type="text"
                            id="roomId"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={createGame}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Créer une partie
                        </button>

                        <button
                            onClick={joinGame}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Rejoindre une partie
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}