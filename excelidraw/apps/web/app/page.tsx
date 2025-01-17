'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { EraserIcon } from 'lucide-react'

const MotionLink = motion(Link)

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-8 rounded-lg shadow-lg w-96 text-center'
      >
        <EraserIcon className='w-16 h-16 text-blue-500 mx-auto' />
        <h1 className='text-3xl font-bold mb-6 text-gray-800'>
          Welcome to Excelidraw
        </h1>
        {isLoggedIn ? <AuthenticatedView /> : <UnauthenticatedView />}
      </motion.div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className='flex justify-center items-center min-h-screen'>
      <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500'></div>
    </div>
  )
}

function AuthenticatedView() {
  return (
    <MotionLink
      href='/rooms'
      className='block w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200'
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Go to Rooms
    </MotionLink>
  )
}

function UnauthenticatedView() {
  return (
    <div className='space-y-4'>
      <MotionLink
        href='/signup'
        className='block w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Sign Up
      </MotionLink>
      <MotionLink
        href='/signin'
        className='block w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors duration-200'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Sign In
      </MotionLink>
    </div>
  )
}
