import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

interface Message {
    username: string
    message: string
}

interface PlayersInfo {
    playerCount: number
    maxPlayers: number
    players: string[]
}

export default function Game() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [playersInfo, setPlayersInfo] = useState<PlayersInfo>({
        playerCount: 0,
        maxPlayers: 16,
        players: []
    })

    useEffect(() => {
        const username = localStorage.getItem('username')
        if (!username) {
            navigate('/')
            return
        }

        socket.emit('join_room', { roomId, username })

        socket.on('room_joined', (data) => {
            setPlayersInfo(data.playersInfo)
        })

        socket.on('player_joined', (data) => {
            setPlayersInfo(data.playersInfo)
            setMessages(prev => [...prev, { username: 'Système', message: `${data.username} a rejoint la partie` }])
        })

        socket.on('player_left', (data) => {
            setPlayersInfo(data.playersInfo)
            setMessages(prev => [...prev, { username: 'Système', message: `${data.username} a quitté la partie` }])
        })

        socket.on('chat_message', (data) => {
            setMessages(prev => [...prev, data])
        })

        socket.on('error', (data) => {
            setMessages(prev => [...prev, { username: 'Système', message: `Erreur: ${data.message}` }])
        })

        return () => {
            socket.off('room_joined')
            socket.off('player_joined')
            socket.off('player_left')
            socket.off('chat_message')
            socket.off('error')
        }
    }, [roomId, navigate])

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (message.trim()) {
            socket.emit('chat_message', { roomId, message })
            setMessage('')
        }
    }

    const leaveRoom = () => {
        socket.emit('leave_room', { roomId })
        navigate('/')
    }

    return (
        <div className="min-h-screen flex flex-col p-6 bg-gray-100">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Room #{roomId}</h1>
                    <button
                        onClick={leaveRoom}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                        Quitter
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 gap-6">
                {/* Players list */}
                <div className="w-1/4 bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Joueurs ({playersInfo.playerCount}/{playersInfo.maxPlayers})</h2>
                    <div className="space-y-2">
                        {playersInfo.players.map(player => (
                            <div key={player} className="px-3 py-2 bg-gray-50 rounded text-gray-700">
                                {player}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Chat</h2>

                    <div className="flex-1 overflow-y-auto mb-4 space-y-2 p-4 bg-gray-50 rounded min-h-[300px]">
                        {messages.map((msg, index) => (
                            <div key={index} className="p-2 rounded bg-white shadow-sm">
                                <span className={`font-semibold ${msg.username === 'Système' ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {msg.username}:
                                </span>
                                <span className="text-gray-700 ml-2">{msg.message}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Votre message..."
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
                        >
                            Envoyer
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}