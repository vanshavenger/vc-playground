'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Room {
  id: string
  name: string
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
    const router = useRouter()
    

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8081/room', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      } else {
        setError('Failed to fetch rooms')
      }
    } catch {
      setError('An error occurred while fetching rooms')
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch('http://localhost:8081/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: newRoomName }),
      })
      if (response.ok) {
        const newRoom = await response.json()
        setRooms([...rooms, newRoom])
        setNewRoomName('')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to create room')
      }
    } catch  {
      setError('An error occurred while creating the room')
    }
  }

  const joinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`)
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Loading rooms...
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6'>
        <h1 className='text-2xl font-bold mb-6'>Rooms</h1>
        {error && <p className='text-red-500 mb-4'>{error}</p>}
        <form onSubmit={createRoom} className='mb-6'>
          <input
            type='text'
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            placeholder='New room name'
            className='w-full px-3 py-2 border rounded mr-2'
            required
          />
          <button
            type='submit'
            className='mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Create Room
          </button>
        </form>
        {rooms.length === 0 ? (
          <p>No rooms available. Create one to get started!</p>
        ) : (
          <ul className='space-y-2'>
            {rooms.map(room => (
              <li
                key={room.id}
                className='flex items-center justify-between bg-gray-50 p-3 rounded'
              >
                <span>{room.name}</span>
                <button
                  onClick={() => joinRoom(room.id)}
                  className='bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600'
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
