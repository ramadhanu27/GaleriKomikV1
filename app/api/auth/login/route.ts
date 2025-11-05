/**
 * Login API Route
 * Server-side authentication with HttpOnly cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { setAuthCookies, setSessionCookie } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    // Validate input
    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    let userEmail = email

    // If username provided, get email from database
    if (!email && username) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'Username tidak ditemukan' },
          { status: 404 }
        )
      }

      userEmail = userData.email
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        { error: 'Email/Username atau password salah' },
        { status: 401 }
      )
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Set HttpOnly cookies with tokens (SECURE!)
    await setAuthCookies(
      data.session.access_token,
      data.session.refresh_token
    )

    // Set session cookie with user info (non-sensitive, readable by client)
    await setSessionCookie({
      userId: data.user.id,
      email: data.user.email!,
      username: data.user.user_metadata?.username,
    })

    // Return success (NO TOKENS in response body!)
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
        avatar_url: data.user.user_metadata?.avatar_url,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
