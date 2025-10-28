import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huhhzvaiqskhldhxexcu.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aGh6dmFpcXNraGxkaHhleGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTQ0MTgsImV4cCI6MjA3NjI3MDQxOH0.thb-ZhcqF7_gamR8t6aANAWTbeqTnKR7sk7qRmO8ut4'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Use localStorage instead of cookies to reduce site data
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'arkomik-auth',
    // Don't auto-refresh token to reduce network calls
    autoRefreshToken: true,
    // Persist session only in localStorage, not cookies
    persistSession: true,
    // Detect session from URL (for OAuth)
    detectSessionInUrl: true,
    // Flow type for better security
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'arkomik-web',
    },
  },
})

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'komiku-data'
