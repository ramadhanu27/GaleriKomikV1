import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  username: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: {
    username?: string
    avatar_url?: string
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Update users table
    const { error: dbError } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (dbError) {
      return { success: false, error: dbError.message }
    }

    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updates
    })

    if (authError) {
      console.error('Error updating auth metadata:', authError)
    }

    return { success: true, message: 'Profile updated successfully' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    return { success: true, url: data.publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

/**
 * Change password
 */
export async function changePassword(
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Password changed successfully' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
