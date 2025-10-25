import { supabase } from './supabase'

export interface Comment {
  id: string
  user_id: string
  manhwa_slug: string
  chapter_id?: string
  comment_text: string
  created_at: string
  updated_at: string
  user?: {
    username: string
    avatar_url?: string
  }
}

/**
 * Add comment to manhwa or chapter
 */
export async function addComment(
  userId: string,
  manhwaSlug: string,
  commentText: string,
  chapterId?: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        manhwa_slug: manhwaSlug,
        chapter_id: chapterId,
        comment_text: commentText,
      })
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, comment: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get comments for manhwa
 */
export async function getManhwaComments(
  manhwaSlug: string,
  limit: number = 50
): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .eq('manhwa_slug', manhwaSlug)
      .is('chapter_id', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

/**
 * Get comments for chapter
 */
export async function getChapterComments(
  manhwaSlug: string,
  chapterId: string,
  limit: number = 50
): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .eq('manhwa_slug', manhwaSlug)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

/**
 * Update comment
 */
export async function updateComment(
  commentId: string,
  userId: string,
  commentText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        comment_text: commentText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
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
 * Delete comment
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
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
 * Get comment count for manhwa
 */
export async function getCommentCount(manhwaSlug: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('manhwa_slug', manhwaSlug)

    if (error) {
      console.error('Error counting comments:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting comments:', error)
    return 0
  }
}
