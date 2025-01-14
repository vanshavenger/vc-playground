"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  if (isLoggedIn) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='bg-white p-8 rounded-lg shadow-md w-96 text-center'>
          <h1 className='text-3xl font-bold mb-6'>Welcome to Excelidraw</h1>
          <Link
            href='/rooms'
            className='block w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600'
          >
            Go to Rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-96 text-center'>
        <h1 className='text-3xl font-bold mb-6'>Welcome to Excelidraw</h1>
        <div className='space-y-4'>
          <Link
            href='/signup'
            className='block w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600'
          >
            Sign Up
          </Link>
          <Link
            href='/signin'
            className='block w-full bg-green-500 text-white py-2 rounded hover:bg-green-600'
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
