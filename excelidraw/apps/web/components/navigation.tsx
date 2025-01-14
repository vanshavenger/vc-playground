'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    router.push('/')
  }

  return (
    <nav className='bg-gray-800 text-white p-4'>
      <div className='container mx-auto flex justify-between items-center'>
        <Link href='/' className='text-xl font-bold'>
          Excelidraw
        </Link>
        <div>
          {isLoggedIn ? (
            <>
              <Link href='/rooms' className='mr-4 hover:text-gray-300'>
                Rooms
              </Link>
              <button
                onClick={handleLogout}
                className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href='/signin' className='mr-4 hover:text-gray-300'>
                Sign In
              </Link>
              <Link href='/signup' className='hover:text-gray-300'>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
