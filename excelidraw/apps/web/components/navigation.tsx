'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu'
import { Button } from '@repo/ui/components/ui/button'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/ui/avatar'
import { LogOut, User } from 'lucide-react'

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUsername = localStorage.getItem('username')
    setIsLoggedIn(!!token)
    setUsername(storedUsername || '')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    router.push('/')
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-white border-b border-gray-200 py-4 px-6 shadow-sm'
    >
      <div className='container mx-auto flex justify-between items-center'>
        <Link
          href='/'
          className='text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors'
        >
          Excelidraw
        </Link>
        <AnimatePresence mode='wait'>
          {isLoggedIn ? (
            <motion.div
              key='logged-in'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className='flex items-center space-x-4'
            >
              <Button variant='ghost' asChild>
                <Link href='/rooms'>Rooms</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full'
                  >
                    <Avatar>
                      <AvatarImage
                        src={`https://avatars.dicebear.com/api/avataaars/${username}.svg`}
                      />
                      <AvatarFallback>
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {username}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {username}@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href='/profile' className='w-full'>
                      <User className='mr-2 h-4 w-4' />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div
              key='logged-out'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className='space-x-2'
            >
              {' '}
              <Button variant='ghost' asChild>
                <Link href='/signin'>Sign In</Link>
              </Button>
              <Button variant='default' asChild>
                <Link href='/signup'>Sign Up</Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
