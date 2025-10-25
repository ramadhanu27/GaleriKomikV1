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
 * Compress image before upload
 */
async function compressImage(file: File, maxWidth: number = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

/**
 * Upload avatar image (optimized with compression)
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Compress image first
    const compressedBlob = await compressImage(file)
    const fileName = `${userId}-${Date.now()}.jpg`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, compressedBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg'
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
