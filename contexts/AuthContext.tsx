'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, getCurrentUser } from '@/lib/auth'
import { validateAndFixSession, debugSession } from '@/lib/sessionHelper'

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
      console.log('🚀 Initializing auth...')
      
      // Debug session info
      debugSession()
      
      // Validate and fix session if needed
      const isValid = await validateAndFixSession()
      console.log('Session validation result:', isValid)
      
      // Check user regardless of validation result
      await checkUser()
    }
    
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, updating context')
        await checkUser()
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out')
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed')
        await checkUser()
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated')
        await checkUser()
      } else if (event === 'INITIAL_SESSION') {
        console.log('🎯 Initial session loaded')
        await checkUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      console.log('🔍 Checking user session...')
      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        console.log('✅ User found:', currentUser.email)
        setUser(currentUser)
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

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername
      
      // Check if input is username
      if (!emailOrUsername.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', emailOrUsername)
          .single()
        
        if (userError || !userData) {
          return { success: false, error: 'Username tidak ditemukan' }
        }
        
        email = userData.email
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: 'Email/Username atau password salah' }
      }

      // Set user immediately from auth data (faster)
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          username: data.user.user_metadata?.username,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        })
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (signUpError) {
        return { success: false, error: signUpError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          username,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }

      await checkUser()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear all auth-related data from localStorage
      if (typeof window !== 'undefined') {
        // Remove Supabase auth token
        localStorage.removeItem('arkomik-auth')
        // Remove any other auth-related keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      setUser(null)
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
