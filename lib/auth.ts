import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  created_at: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  error?: string
}

/**
 * Register new user
 */
export async function registerUser(email: string, password: string, username: string): Promise<AuthResponse> {
  try {
    // Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
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

    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        username,
        created_at: authData.user.created_at,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Login user with email or username
 */
export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResponse> {
  try {
    let email = emailOrUsername
    
    // Check if input is username (not email format)
    if (!emailOrUsername.includes('@')) {
      // Find user by username to get email
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

    // Login with email
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: 'Email/Username atau password salah' }
    }

    if (!data.user) {
      return { success: false, error: 'Login gagal' }
    }

    return {
      success: true,
      message: 'Login berhasil!',
      user: {
        id: data.user.id,
        email: data.user.email!,
        username: data.user.user_metadata?.username,
        avatar_url: data.user.user_metadata?.avatar_url,
        created_at: data.user.created_at,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Logged out successfully' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get current user (optimized - uses session)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // First check session (more reliable)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }

    if (!session?.user) {
      // Try to get user directly as fallback
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return null
      }

      return {
        id: user.id,
        email: user.email!,
        username: user.user_metadata?.username,
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
      }
    }

    // Return user from session
    return {
      id: session.user.id,
      email: session.user.email!,
      username: session.user.user_metadata?.username,
      avatar_url: session.user.user_metadata?.avatar_url,
      created_at: session.user.created_at,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}
