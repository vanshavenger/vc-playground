import { useState, useEffect, useCallback } from 'react'
import { HTTP_BACKEND_BASE_URL } from '@/lib/utils'

interface Room {
  id: string
  name: string
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/room`, {
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
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const createRoom = async (name: string) => {
    setError('')
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        const newRoom = await response.json()
        setRooms(prevRooms => [
          ...prevRooms,
          {
            id: newRoom.roomID,
            name: newRoom.name,
          },
        ])
        return true
      } else {
        const data = await response.json()
        setError(JSON.parse(data.message)[0].message || 'Failed to create room')
        return false
      }
    } catch {
      setError('An error occurred while creating the room')
      return false
    }
  }

  const deleteRoom = async (roomId: string) => {
    setError('')
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/room/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId))
        return true
      } else {
        setError('Failed to delete room')
        return false
      }
    } catch {
      setError('An error occurred while deleting the room')
      return false
    }
  }

  return {
    rooms,
    error,
    loading,
    createRoom,
    deleteRoom,
    refetchRooms: fetchRooms,
  }
}
