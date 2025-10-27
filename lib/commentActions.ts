import { supabase } from './supabase'
import { Comment } from './comments'

/**
 * Like/Unlike a comment
 */
export async function toggleCommentLike(
  commentId: string,
  userId: string
): Promise<{ success: boolean; liked: boolean; error?: string }> {
  try {
    // Check if user already liked this comment
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking like:', checkError)
      return { success: false, liked: false, error: checkError.message }
    }

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        return { success: false, liked: true, error: deleteError.message }
      }

      return { success: true, liked: false }
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
        })

      if (insertError) {
        return { success: false, liked: false, error: insertError.message }
      }

      return { success: true, liked: true }
    }
  } catch (error: any) {
    console.error('Toggle like error:', error)
    return { success: false, liked: false, error: error.message }
  }
}

/**
 * Get likes count for a comment
 */
export async function getCommentLikesCount(commentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)

    if (error) {
      console.error('Error counting likes:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting likes:', error)
    return 0
  }
}

/**
 * Check if user has liked a comment
 */
export async function hasUserLikedComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking like:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking like:', error)
    return false
  }
}

/**
 * Add a reply to a comment
 */
export async function addReply(
  userId: string,
  manhwaSlug: string,
  commentText: string,
  parentId: string,
  chapterId?: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User'
    const avatarUrl = user.user_metadata?.avatar_url

    // Insert reply
    const { data: commentData, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        username: username,
        avatar_url: avatarUrl,
        manhwa_slug: manhwaSlug,
        chapter_id: chapterId,
        comment_text: commentText,
        parent_id: parentId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert reply error:', insertError)
      return { success: false, error: insertError.message }
    }

    const comment: Comment = {
      ...commentData,
      user: {
        username: commentData.username,
        avatar_url: commentData.avatar_url
      }
    }

    return { success: true, comment }
  } catch (error: any) {
    console.error('Add reply error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(
  commentId: string,
  limit: number = 20
): Promise<Comment[]> {
  try {
    const { data: replies, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching replies:', error)
      return []
    }

    if (!replies || replies.length === 0) {
      return []
    }

    const repliesWithUsers: Comment[] = replies.map(reply => ({
      ...reply,
      user: {
        username: reply.username || 'User',
        avatar_url: reply.avatar_url
      }
    }))

    return repliesWithUsers
  } catch (error) {
    console.error('Error fetching replies:', error)
    return []
  }
}

/**
 * Get replies count for a comment
 */
export async function getCommentRepliesCount(commentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', commentId)

    if (error) {
      console.error('Error counting replies:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting replies:', error)
    return 0
  }
}

/**
 * Edit comment
 */
export async function editComment(
  commentId: string,
  userId: string,
  newText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        comment_text: newText,
        updated_at: new Date().toISOString(),
        is_edited: true,
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
