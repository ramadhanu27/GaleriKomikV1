/**
 * Cleanup Old Auth System
 * Removes old non-HttpOnly cookies
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Force dynamic rendering (required for cookies usage)
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // List of old cookies to remove
    const oldCookies = [
      'arkomik-aut',
      'arkomik-session',
      'arkomik-auth',
      'sb-access-token',
      'sb-refresh-token',
    ]
    
    // Delete all old cookies
    oldCookies.forEach(cookieName => {
      cookieStore.delete(cookieName)
    })
    
    console.log('🧹 Old cookies cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'Old auth cookies removed',
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
