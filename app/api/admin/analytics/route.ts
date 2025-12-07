import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalManga: number
    totalBookmarks: number
    totalComments: number
    activeUsersToday: number
    activeUsersThisWeek: number
    activeUsersThisMonth: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
  }
  userActivity: {
    daily: Array<{ date: string; users: number; newUsers: number }>
    weekly: Array<{ week: string; users: number; newUsers: number }>
    monthly: Array<{ month: string; users: number; newUsers: number }>
  }
  popularManga: Array<{
    slug: string
    title: string
    views: number
    bookmarks: number
    comments: number
    rating: number
  }>
  userEngagement: {
    avgSessionDuration: number
    pagesPerSession: number
    bounceRate: number
    returnUserRate: number
  }
  systemStats: {
    serverUptime: number
    apiCallsToday: number
    storageUsed: number
    cacheHitRate: number
  }
}

// GET - Fetch comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    if (!encryptedAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d' // 7d, 30d, 90d

    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData(timeRange)

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange
    })
  } catch (error) {
    console.error('Error in analytics GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchAnalyticsData(timeRange: string): Promise<AnalyticsData> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Calculate date ranges
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  try {
    // Fetch overview stats
    const [
      { count: totalUsers },
      { count: totalBookmarks },
      { count: totalComments },
      { count: usersToday },
      { count: usersThisWeek },
      { count: usersThisMonth },
      { count: newUsersToday },
      { count: newUsersThisWeek },
      { count: newUsersThisMonth }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_sign_in_at', today.toISOString()),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_sign_in_at', weekAgo.toISOString()),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_sign_in_at', monthAgo.toISOString()),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString())
    ])

    // Fetch manga count
    const mangaResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/komiku_list?select=count`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'count=exact'
      }
    })
    const totalManga = parseInt(mangaResponse.headers.get('content-range')?.split('/')[1] || '0')

    // Generate user activity data
    const userActivity = await generateUserActivityData(timeRange)

    // Fetch popular manga
    const popularManga = await fetchPopularManga()

    // Generate user engagement metrics
    const userEngagement = await generateUserEngagementMetrics()

    // Generate system stats
    const systemStats = await generateSystemStats()

    return {
      overview: {
        totalUsers: totalUsers || 0,
        totalManga,
        totalBookmarks: totalBookmarks || 0,
        totalComments: totalComments || 0,
        activeUsersToday: usersToday || 0,
        activeUsersThisWeek: usersThisWeek || 0,
        activeUsersThisMonth: usersThisMonth || 0,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0
      },
      userActivity,
      popularManga,
      userEngagement,
      systemStats
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    // Return empty data structure on error
    return {
      overview: {
        totalUsers: 0,
        totalManga: 0,
        totalBookmarks: 0,
        totalComments: 0,
        activeUsersToday: 0,
        activeUsersThisWeek: 0,
        activeUsersThisMonth: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0
      },
      userActivity: {
        daily: [],
        weekly: [],
        monthly: []
      },
      popularManga: [],
      userEngagement: {
        avgSessionDuration: 0,
        pagesPerSession: 0,
        bounceRate: 0,
        returnUserRate: 0
      },
      systemStats: {
        serverUptime: 0,
        apiCallsToday: 0,
        storageUsed: 0,
        cacheHitRate: 0
      }
    }
  }
}

async function generateUserActivityData(timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const daily = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    // Simulate data - in real implementation, fetch from database
    daily.push({
      date: date.toISOString().split('T')[0],
      users: Math.floor(Math.random() * 100) + 20,
      newUsers: Math.floor(Math.random() * 20) + 1
    })
  }

  // Generate weekly data
  const weekly = []
  for (let i = 12; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - (i * 7))
    weekly.push({
      week: `Week ${13 - i}`,
      users: Math.floor(Math.random() * 500) + 100,
      newUsers: Math.floor(Math.random() * 50) + 5
    })
  }

  // Generate monthly data
  const monthly = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    monthly.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      users: Math.floor(Math.random() * 2000) + 500,
      newUsers: Math.floor(Math.random() * 200) + 20
    })
  }

  return { daily, weekly, monthly }
}

async function fetchPopularManga() {
  try {
    // Fetch manga with engagement stats
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/komiku_list?select=slug,manhwaTitle,image&order=created_at.desc&limit=10`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`
      }
    })
    
    const manga = await response.json()
    
    // Add engagement metrics
    const popularManga = await Promise.all(manga.map(async (m: any) => {
      const [bookmarkCount, commentCount] = await Promise.all([
        fetchBookmarkCount(m.slug),
        fetchCommentCount(m.slug)
      ])
      
      return {
        slug: m.slug,
        title: m.manhwaTitle,
        image: m.image,
        views: Math.floor(Math.random() * 50000) + 1000, // Placeholder
        bookmarks: bookmarkCount,
        comments: commentCount,
        rating: (Math.random() * 2 + 3).toFixed(1) // 3.0-5.0 rating
      }
    }))
    
    return popularManga.sort((a, b) => b.views - a.views)
  } catch (error) {
    console.error('Error fetching popular manga:', error)
    return []
  }
}

async function fetchBookmarkCount(slug: string): Promise<number> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookmarks?manhwa_slug=eq.${slug}&select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
        'Prefer': 'count=exact'
      }
    })
    return parseInt(response.headers.get('content-range')?.split('/')[1] || '0')
  } catch {
    return 0
  }
}

async function fetchCommentCount(slug: string): Promise<number> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/comments?manhwa_slug=eq.${slug}&select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
        'Prefer': 'count=exact'
      }
    })
    return parseInt(response.headers.get('content-range')?.split('/')[1] || '0')
  } catch {
    return 0
  }
}

async function generateUserEngagementMetrics() {
  // Simulate engagement metrics - in real implementation, calculate from actual data
  return {
    avgSessionDuration: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
    pagesPerSession: Math.floor(Math.random() * 10) + 3, // 3-13 pages
    bounceRate: Math.floor(Math.random() * 30) + 20, // 20-50%
    returnUserRate: Math.floor(Math.random() * 40) + 40 // 40-80%
  }
}

async function generateSystemStats() {
  // Simulate system stats - in real implementation, fetch from monitoring systems
  return {
    serverUptime: Math.floor(Math.random() * 30) + 90, // 90-120 days
    apiCallsToday: Math.floor(Math.random() * 10000) + 5000, // 5k-15k calls
    storageUsed: Math.floor(Math.random() * 50) + 10, // 10-60 GB
    cacheHitRate: Math.floor(Math.random() * 20) + 75 // 75-95%
  }
}
