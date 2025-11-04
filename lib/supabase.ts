'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huhhzvaiqskhldhxexcu.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aGh6dmFpcXNraGxkaHhleGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTQ0MTgsImV4cCI6MjA3NjI3MDQxOH0.thb-ZhcqF7_gamR8t6aANAWTbeqTnKR7sk7qRmO8ut4'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Use default localStorage (no custom cookie storage)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'arkomik-web',
    },
  },
})

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'komiku-data'
