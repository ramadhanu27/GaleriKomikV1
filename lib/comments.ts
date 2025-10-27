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
    // Get user data from auth first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User error:', userError)
      return { success: false, error: 'User not found' }
    }

    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User'
    const avatarUrl = user.user_metadata?.avatar_url

    // Insert comment with user data
    const { data: commentData, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        manhwa_slug: manhwaSlug,
        chapter_id: chapterId,
        comment_text: commentText,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return { success: false, error: insertError.message }
    }

    // Format comment with user object
    const comment: Comment = {
      ...commentData,
      user: {
        username: commentData.username,
        avatar_url: commentData.avatar_url
      }
    }

    return { success: true, comment }
  } catch (error: any) {
    console.error('Add comment error:', error)
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
    // Check if table exists and has required columns
    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, user_id, manhwa_slug, chapter_id, comment_text, created_at, updated_at, username, avatar_url')
      .eq('manhwa_slug', manhwaSlug)
      .is('chapter_id', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching comments:', error)
      console.error('Error details:', error.message, error.code)
      
      // If column doesn't exist, return empty array
      if (error.message.includes('column') || error.code === 'PGRST116') {
        console.warn('Comments table schema issue. Please run fix-comments-table.sql')
        return []
      }
      
      return []
    }

    if (!comments || comments.length === 0) {
      return []
    }

    // Format comments with user object
    const commentsWithUsers: Comment[] = comments.map(comment => ({
      ...comment,
      user: {
        username: comment.username || 'User',
        avatar_url: comment.avatar_url
      }
    }))

    return commentsWithUsers
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    console.error('Error type:', error?.constructor?.name)
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
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('manhwa_slug', manhwaSlug)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    if (!comments || comments.length === 0) {
      return []
    }

    // Format comments with user object
    const commentsWithUsers: Comment[] = comments.map(comment => ({
      ...comment,
      user: {
        username: comment.username || 'User',
        avatar_url: comment.avatar_url
      }
    }))

    return commentsWithUsers
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
