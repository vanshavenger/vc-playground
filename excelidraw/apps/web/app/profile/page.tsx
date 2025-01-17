'use client'

import { useState, useEffect, useCallback } from 'react'
import { HTTP_BACKEND_BASE_URL } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface UserProfile {
  id: string
  username: string
  email: string
  createdAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
      setUsername(data.username)
      setEmail(data.email)
    } catch (err) {
      setError('Failed to load profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError(null)
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username, email }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.message) {
          if (
            errorData.message.includes(
              'Unique constraint failed on the fields: (`username`)'
            )
          ) {
            throw new Error(
              'This username is already taken. Please choose a different username.'
            )
          } else if (
            errorData.message.includes(
              'Unique constraint failed on the fields: (`email`)'
            )
          ) {
            throw new Error(
              'This email is already associated with an account. Please use a different email.'
            )
          }
        }
        throw new Error('Failed to update profile')
      }
      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl'
      >
        <div className='p-8'>
          <div className='uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1'>
            Your Profile
          </div>
          {error && (
            <div
              className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4'
              role='alert'
            >
              <strong className='font-bold'>Error: </strong>
              <span className='block sm:inline'>{error}</span>
            </div>
          )}
          {isEditing ? (
            <form onSubmit={handleUpdate} className='space-y-4'>
              <div>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h2 className='block mt-1 text-lg leading-tight font-medium text-black'>
                {profile?.username}
              </h2>
              <p className='mt-2 text-gray-500'>{profile?.email}</p>
              <p className='mt-2 text-sm text-gray-500'>
                Joined on:{' '}
                {new Date(profile?.createdAt ?? '').toLocaleDateString()}
              </p>
              <div className='mt-4'>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
