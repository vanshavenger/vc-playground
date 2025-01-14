'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HTTP_BACKEND_BASE_URL } from '@/lib/utils'

export default function SignIn() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        router.push('/rooms')
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch {
      setError('An error occurred during sign in')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-96'>
        <h1 className='text-2xl font-bold mb-6 text-center'>Sign In</h1>
        {error && <p className='text-red-500 mb-4'>{error}</p>}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='username' className='block mb-1'>
              Username
            </label>
            <input
              type='text'
              id='username'
              value={username}
              onChange={e => setUsername(e.target.value)}
              className='w-full px-3 py-2 border rounded'
              required
            />
          </div>
          <div>
            <label htmlFor='password' className='block mb-1'>
              Password
            </label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='w-full px-3 py-2 border rounded'
              required
            />
          </div>
          <button
            type='submit'
            className='w-full bg-green-500 text-white py-2 rounded hover:bg-green-600'
          >
            Sign In
          </button>
        </form>
        <p className='mt-4 text-center'>
          Don&apos;t have an account?{' '}
          <Link href='/signup' className='text-blue-500 hover:underline'>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
