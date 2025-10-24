import { supabase } from './supabase'

export interface ReadingHistory {
  id: string
  user_id: string
  manhwa_slug: string
  manhwa_title: string
  manhwa_image: string
  manhwa_type?: string
  chapter_number: string
  chapter_id: string
  last_read_at: string
}

/**
 * Add or update reading history
 */
export async function addReadingHistory(
  userId: string,
  manhwaSlug: string,
  manhwaTitle: string,
  manhwaImage: string,
  chapterNumber: string,
  chapterId: string,
  manhwaType?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Upsert (insert or update if exists)
    const { error } = await supabase
      .from('reading_history')
      .upsert({
        user_id: userId,
        manhwa_slug: manhwaSlug,
        manhwa_title: manhwaTitle,
        manhwa_image: manhwaImage,
        manhwa_type: manhwaType,
        chapter_number: chapterNumber,
        chapter_id: chapterId,
        last_read_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,manhwa_slug,chapter_id'
      })

    if (error) {
      console.error('Error adding reading history:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Reading history updated' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get user reading history
 */
export async function getReadingHistory(userId: string, limit: number = 50): Promise<ReadingHistory[]> {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching reading history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching reading history:', error)
    return []
  }
}

/**
 * Get latest read chapter for a manhwa
 */
export async function getLatestReadChapter(
  userId: string,
  manhwaSlug: string
): Promise<ReadingHistory | null> {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .eq('manhwa_slug', manhwaSlug)
      .order('last_read_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

/**
 * Clear reading history
 */
export async function clearReadingHistory(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete specific history entry
 */
export async function deleteHistoryEntry(
  userId: string,
  historyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
