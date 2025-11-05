'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize auth on mount
    const initAuth = async () => {
      console.log('🚀 Initializing auth (server-side)...')
      
      // Clean up old auth system (one-time)
      try {
        await fetch('/api/auth/cleanup', {
          method: 'POST',
          credentials: 'include',
        })
        console.log('🧹 Old auth system cleaned')
      } catch (error) {
        console.error('Cleanup error:', error)
      }
      
      await checkUser()
    }
    
    initAuth()

    // Set up auto-refresh (every 14 minutes)
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing token...')
      await refreshToken()
    }, 14 * 60 * 1000) // 14 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  const checkUser = async () => {
    try {
      console.log('🔍 Checking user session (server-side)...')
      
      // Call server-side API to get user (uses HttpOnly cookie)
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important: send cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ User found:', data.user.email)
        setUser(data.user)
      } else {
        console.log('⚠️ No user session found')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        console.log('✅ Token refreshed')
        return true
      } else {
        console.log('⚠️ Token refresh failed')
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error)
      setUser(null)
      return false
    }
  }

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      // Call server-side login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: receive cookies
        body: JSON.stringify({
          email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
          username: !emailOrUsername.includes('@') ? emailOrUsername : undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      // Set user from response (NO TOKENS!)
      setUser(data.user)
      console.log('✅ Logged in successfully')

      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'Login failed' }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Call server-side register API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: receive cookies
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' }
      }

      // Set user from response (NO TOKENS!)
      setUser(data.user)
      console.log('✅ Registered successfully')

      return { success: true }
    } catch (error: any) {
      console.error('Register error:', error)
      return { success: false, error: error.message || 'Registration failed' }
    }
  }

  const signOut = async () => {
    try {
      // Call server-side logout API (clears HttpOnly cookies)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      setUser(null)
      console.log('✅ Logged out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await checkUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
