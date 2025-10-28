/**
 * Session Helper Functions
 * Utility functions to manage and debug user sessions
 */

import { supabase } from './supabase'

/**
 * Check if session exists in localStorage
 */
export function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const storedAuth = localStorage.getItem('arkomik-auth')
    if (!storedAuth) return false
    
    const authData = JSON.parse(storedAuth)
    return !!(authData?.access_token || authData?.session?.access_token)
  } catch {
    return false
  }
}

/**
 * Get session info from localStorage
 */
export function getStoredSessionInfo(): {
  hasSession: boolean
  expiresAt?: string
  email?: string
} {
  if (typeof window === 'undefined') {
    return { hasSession: false }
  }
  
  try {
    const storedAuth = localStorage.getItem('arkomik-auth')
    if (!storedAuth) return { hasSession: false }
    
    const authData = JSON.parse(storedAuth)
    const session = authData?.session || authData
    
    return {
      hasSession: !!session?.access_token,
      expiresAt: session?.expires_at,
      email: session?.user?.email,
    }
  } catch {
    return { hasSession: false }
  }
}

/**
 * Verify if session is still valid
 */
export async function verifySession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session verification error:', error)
      return false
    }
    
    return !!session
  } catch (error) {
    console.error('Session verification failed:', error)
    return false
  }
}

/**
 * Refresh session if needed
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.log('No session to refresh')
      return false
    }
    
    // Check if token is about to expire (within 5 minutes)
    const expiresAt = session.expires_at
    if (!expiresAt) return true
    
    const expiresInMs = expiresAt * 1000 - Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    if (expiresInMs < fiveMinutes) {
      console.log('🔄 Token expiring soon, refreshing...')
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError)
        return false
      }
      
      console.log('✅ Session refreshed successfully')
      return !!data.session
    }
    
    return true
  } catch (error) {
    console.error('Session refresh failed:', error)
    return false
  }
}

/**
 * Debug session info
 */
export function debugSession(): void {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment')
    return
  }
  
  console.group('🔐 Session Debug Info')
  
  // Check localStorage
  const storedAuth = localStorage.getItem('arkomik-auth')
  console.log('localStorage key exists:', !!storedAuth)
  
  if (storedAuth) {
    try {
      const authData = JSON.parse(storedAuth)
      console.log('Session data:', {
        hasAccessToken: !!authData?.access_token,
        hasRefreshToken: !!authData?.refresh_token,
        expiresAt: authData?.expires_at,
        user: authData?.user?.email,
      })
    } catch (e) {
      console.error('Failed to parse auth data:', e)
    }
  }
  
  // Check session info
  const sessionInfo = getStoredSessionInfo()
  console.log('Session info:', sessionInfo)
  
  console.groupEnd()
}

/**
 * Force session reload
 */
export async function forceSessionReload(): Promise<boolean> {
  try {
    console.log('🔄 Force reloading session...')
    
    // Get fresh session from server
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Failed to reload session:', error)
      return false
    }
    
    if (session) {
      console.log('✅ Session reloaded:', session.user.email)
      return true
    }
    
    console.log('⚠️ No session available')
    return false
  } catch (error) {
    console.error('Session reload failed:', error)
    return false
  }
}

/**
 * Clear invalid session
 */
export function clearInvalidSession(): void {
  if (typeof window === 'undefined') return
  
  try {
    console.log('🗑️ Clearing invalid session...')
    localStorage.removeItem('arkomik-auth')
    
    // Clear any other auth keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('auth') || key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('✅ Invalid session cleared')
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Validate and fix session
 */
export async function validateAndFixSession(): Promise<boolean> {
  try {
    console.log('🔍 Validating session...')
    
    // Check if session exists
    const hasStored = hasStoredSession()
    console.log('Has stored session:', hasStored)
    
    if (!hasStored) {
      console.log('⚠️ No stored session')
      return false
    }
    
    // Verify session is valid
    const isValid = await verifySession()
    console.log('Session is valid:', isValid)
    
    if (!isValid) {
      console.log('❌ Session invalid, clearing...')
      clearInvalidSession()
      return false
    }
    
    // Try to refresh if needed
    const refreshed = await refreshSessionIfNeeded()
    console.log('Session refreshed:', refreshed)
    
    return refreshed
  } catch (error) {
    console.error('Session validation failed:', error)
    return false
  }
}
