/**
 * Refresh Token API Route
 * Refreshes access token using refresh token from HttpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { getRefreshToken, setAuthCookies, clearAuthCookies } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from HttpOnly cookie
    const refreshToken = await getRefreshToken()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    // Refresh session with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      console.error('Refresh error:', error)
      
      // Clear invalid cookies
      await clearAuthCookies()
      
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      )
    }

    // Set new tokens in HttpOnly cookies
    await setAuthCookies(
      data.session.access_token,
      data.session.refresh_token
    )

    return NextResponse.json({
      success: true,
      expiresAt: data.session.expires_at,
    })
  } catch (error) {
    console.error('Refresh error:', error)
    
    // Clear cookies on error
    await clearAuthCookies()
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
