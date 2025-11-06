/**
 * Get Current User API Route
 * Returns user info using access token from HttpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { getAccessToken } from '@/lib/cookies'

// Force dynamic rendering (required for cookies usage)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get access token from HttpOnly cookie
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user from Supabase using access token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.error('Get user error:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get additional user data from database
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: userData?.username || user.user_metadata?.username,
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
