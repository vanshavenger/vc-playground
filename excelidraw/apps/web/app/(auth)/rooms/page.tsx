'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@repo/ui/components/ui/input'
import { Button } from '@repo/ui/components/ui/button'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRooms } from '@/hooks/use-rooms'

export default function Rooms() {
  const [newRoomName, setNewRoomName] = useState('')
  const router = useRouter()
  const { rooms, error, loading, createRoom, deleteRoom, refetchRooms } =
    useRooms()

  const handleCreateRoom = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (await createRoom(newRoomName)) {
        setNewRoomName('')
        refetchRooms()
      }
    },
    [newRoomName, createRoom, refetchRooms]
  )

  const handleDeleteRoom = useCallback(
  
    async (roomId: string) => {
      console.log(roomId)
      if (await deleteRoom(roomId)) {
        refetchRooms()
      }
    },
    [deleteRoom, refetchRooms]
  )

  const joinRoom = useCallback(
    (roomId: string) => {
      router.push(`/room/${roomId}`)
    },
    [router]
  )

  return (
    <div className='min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6 text-gray-900'>Rooms</h1>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6'
            role='alert'
          >
            <p>{error}</p>
          </motion.div>
        )}
        <form onSubmit={handleCreateRoom} className='mb-8'>
          <div className='flex space-x-2'>
            <Input
              type='text'
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder='New room name'
              className='flex-grow'
              required
              aria-label='New room name'
            />
            <Button
              type='submit'
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Plus className='w-5 h-5 mr-2' />
              Create Room
            </Button>
          </div>
        </form>
        {loading ? (
          <div className='flex justify-center items-center h-64'>
            <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
          </div>
        ) : rooms.length === 0 ? (
          <p className='text-gray-600 text-center text-lg' role='status'>
            No rooms available. Create one to get started!
          </p>
        ) : (
          <ul className='space-y-3' role='list'>
            <AnimatePresence>
              {rooms.map(room => (
                <motion.li
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className='flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                >
                  <span className='text-gray-800 font-medium'>{room.name}</span>
                  <div className='flex space-x-2'>
                    <Button
                      onClick={() => joinRoom(room.id)}
                      className='bg-green-500 hover:bg-green-600 text-white'
                      aria-label={`Join ${room.name}`}
                    >
                      Join
                    </Button>
                    <Button
                      onClick={() => handleDeleteRoom(room.id)}
                      className='bg-red-500 hover:bg-red-600 text-white'
                      aria-label={`Delete ${room.name}`}
                    >
                      <Trash2 className='w-5 h-5' />
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
