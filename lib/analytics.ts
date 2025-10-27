import { supabase } from './supabase'

export interface ViewStats {
  manhwa_slug: string
  total_views: number
  unique_views: number
  last_viewed: string
}

// Debounce tracking to prevent excessive DB calls
const viewTrackingQueue = new Map<string, NodeJS.Timeout>()

/**
 * Track manhwa view with debouncing
 */
export async function trackManhwaView(manhwaSlug: string, userId?: string): Promise<void> {
  // Clear existing timeout for this manhwa
  const existingTimeout = viewTrackingQueue.get(manhwaSlug)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }

  // Set new timeout (debounce 2 seconds)
  const timeout = setTimeout(async () => {
    try {
      await trackManhwaViewImmediate(manhwaSlug, userId)
      viewTrackingQueue.delete(manhwaSlug)
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }, 2000)

  viewTrackingQueue.set(manhwaSlug, timeout)
}

/**
 * Track manhwa view immediately (internal)
 */
async function trackManhwaViewImmediate(manhwaSlug: string, userId?: string): Promise<void> {
  try {
    // Get or create view record
    const { data: existing } = await supabase
      .from('manhwa_views')
      .select('*')
      .eq('manhwa_slug', manhwaSlug)
      .single()

    if (existing) {
      // Update existing
      await supabase
        .from('manhwa_views')
        .update({
          total_views: existing.total_views + 1,
          last_viewed: new Date().toISOString()
        })
        .eq('manhwa_slug', manhwaSlug)
    } else {
      // Create new
      await supabase
        .from('manhwa_views')
        .insert({
          manhwa_slug: manhwaSlug,
          total_views: 1,
          unique_views: 1,
          last_viewed: new Date().toISOString()
        })
    }

    // Track unique view if user is logged in
    if (userId) {
      const { data: userView } = await supabase
        .from('user_views')
        .select('*')
        .eq('user_id', userId)
        .eq('manhwa_slug', manhwaSlug)
        .single()

      if (!userView) {
        await supabase
          .from('user_views')
          .insert({
            user_id: userId,
            manhwa_slug: manhwaSlug,
            viewed_at: new Date().toISOString()
          })

        // Increment unique views
        if (existing) {
          await supabase
            .from('manhwa_views')
            .update({
              unique_views: existing.unique_views + 1
            })
            .eq('manhwa_slug', manhwaSlug)
        }
      }
    }
  } catch (error) {
    console.error('Error tracking view:', error)
  }
}

/**
 * Get manhwa view stats
 */
export async function getManhwaViews(manhwaSlug: string): Promise<ViewStats | null> {
  try {
    const { data, error } = await supabase
      .from('manhwa_views')
      .select('*')
      .eq('manhwa_slug', manhwaSlug)
      .single()

    if (error || !data) return null

    return data
  } catch (error) {
    console.error('Error getting views:', error)
    return null
  }
}

/**
 * Get trending manhwa by views
 */
export async function getTrendingManhwa(limit: number = 10): Promise<ViewStats[]> {
  try {
    const { data, error } = await supabase
      .from('manhwa_views')
      .select('*')
      .order('total_views', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error in getTrendingManhwa:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting trending:', error)
    return []
  }
}

/**
 * Get site analytics
 */
export async function getSiteAnalytics(): Promise<{
  totalViews: number
  totalManhwa: number
  totalUsers: number
  totalComments: number
}> {
  const defaultStats = {
    totalViews: 0,
    totalManhwa: 0,
    totalUsers: 0,
    totalComments: 0
  }

  try {
    let totalViews = 0
    let totalManhwa = 0
    let totalComments = 0

    // Get total views (with error handling)
    try {
      const { data: viewsData, error: viewsError } = await supabase
        .from('manhwa_views')
        .select('total_views')

      if (!viewsError && viewsData) {
        totalViews = viewsData.reduce((sum, item) => sum + item.total_views, 0)
      }
    } catch (error) {
      console.error('Error fetching views:', error)
    }

    // Get total manhwa count (with error handling)
    try {
      const { count, error: manhwaError } = await supabase
        .from('manhwa_views')
        .select('*', { count: 'exact', head: true })

      if (!manhwaError) {
        totalManhwa = count || 0
      }
    } catch (error) {
      console.error('Error counting manhwa:', error)
    }

    // Get total comments (with error handling)
    try {
      const { count, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })

      if (!commentsError) {
        totalComments = count || 0
      }
    } catch (error) {
      console.error('Error counting comments:', error)
    }

    return {
      totalViews,
      totalManhwa,
      totalUsers: 0, // Will be updated with user count
      totalComments
    }
  } catch (error) {
    console.error('Error getting analytics:', error)
    return defaultStats
  }
}
