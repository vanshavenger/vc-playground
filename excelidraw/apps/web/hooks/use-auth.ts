import { useState, useEffect } from 'react'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      setIsLoggedIn(!!token)
      setIsLoading(false)
       console.log('token', token)
    }

    checkAuth()

    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  return { isLoggedIn, isLoading }
}
