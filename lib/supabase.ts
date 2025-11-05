'use client'

import { createClient } from '@supabase/supabase-js'
import { secureStorage } from './secureStorage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huhhzvaiqskhldhxexcu.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aGh6dmFpcXNraGxkaHhleGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTQ0MTgsImV4cCI6MjA3NjI3MDQxOH0.thb-ZhcqF7_gamR8t6aANAWTbeqTnKR7sk7qRmO8ut4'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage adapter that uses encrypted storage
const customStorage = {
  getItem: (key: string) => {
    // Use encrypted storage for auth data
    if (key.includes('auth-token') || key.includes('sb-')) {
      return secureStorage.getItem(key)
    }
    // Use regular localStorage for other data
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null
  },
  setItem: (key: string, value: string) => {
    // Use encrypted storage for auth data
    if (key.includes('auth-token') || key.includes('sb-')) {
      secureStorage.setItem(key, value)
    } else if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Use custom encrypted storage
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Store session in localStorage with encryption
    storageKey: 'arkomik-auth',
  },
  global: {
    headers: {
      'X-Client-Info': 'arkomik-web',
    },
  },
})

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'komiku-data'
