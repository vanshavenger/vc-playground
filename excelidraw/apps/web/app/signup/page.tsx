'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HTTP_BACKEND_BASE_URL } from '@/lib/utils'

export default function SignUp() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`${HTTP_BACKEND_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, name }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess('Sign up successful! Redirecting to sign in...')
        setTimeout(() => router.push('/signin'), 2000)
      } else {
        setError(data.message || 'An error occurred during sign up')
      }
    } catch {
      setError('An error occurred during sign up')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-96'>
        <h1 className='text-2xl font-bold mb-6 text-center'>Sign Up</h1>
        {error && <p className='text-red-500 mb-4'>{error}</p>}
        {success && <p className='text-green-500 mb-4'>{success}</p>}
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
            <label htmlFor='email' className='block mb-1'>
              Email
            </label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
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
          <div>
            <label htmlFor='name' className='block mb-1'>
              Name
            </label>
            <input
              type='text'
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              className='w-full px-3 py-2 border rounded'
              required
            />
          </div>
          <button
            type='submit'
            className='w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600'
          >
            Sign Up
          </button>
        </form>
        <p className='mt-4 text-center'>
          Already have an account?{' '}
          <Link href='/signin' className='text-blue-500 hover:underline'>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
