/**
 * Logout API Route
 * Clears HttpOnly cookies and invalidates session
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { clearAuthCookies, getAccessToken } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    // Get access token from HttpOnly cookie
    const accessToken = await getAccessToken()

    if (accessToken) {
      // Sign out from Supabase (invalidate token on server)
      await supabase.auth.admin.signOut(accessToken)
    }

    // Clear all auth cookies
    await clearAuthCookies()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if error, clear cookies
    await clearAuthCookies()
    
    return NextResponse.json({
      success: true,
      message: 'Logged out',
    })
  }
}
