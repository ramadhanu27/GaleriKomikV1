import { supabase } from './supabase'

export interface Bookmark {
  id: string
  user_id: string
  manhwa_slug: string
  manhwa_title: string
  manhwa_image: string
  manhwa_type?: string
  created_at: string
}

/**
 * Add bookmark
 */
export async function addBookmark(
  userId: string,
  manhwaSlug: string,
  manhwaTitle: string,
  manhwaImage: string,
  manhwaType?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('manhwa_slug', manhwaSlug)
      .single()

    if (existing) {
      return { success: false, error: 'Already bookmarked' }
    }

    // Add bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        manhwa_slug: manhwaSlug,
        manhwa_title: manhwaTitle,
        manhwa_image: manhwaImage,
        manhwa_type: manhwaType,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Bookmark added!' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Remove bookmark
 */
export async function removeBookmark(
  userId: string,
  manhwaSlug: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('manhwa_slug', manhwaSlug)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Bookmark removed!' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get user bookmarks
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return []
  }
}

/**
 * Check if manhwa is bookmarked
 */
export async function isBookmarked(userId: string, manhwaSlug: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('manhwa_slug', manhwaSlug)
      .single()

    return !!data
  } catch (error) {
    return false
  }
}

/**
 * Get bookmark count for user
 */
export async function getBookmarkCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('Error counting bookmarks:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting bookmarks:', error)
    return 0
  }
}
