import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    console.log('🔍 Admin API: Checking authentication...')
    console.log('🔍 Admin API: Encrypted access token exists:', !!encryptedAccessToken)

    if (!encryptedAccessToken) {
      console.log('🔍 Admin API: No access token found')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
      console.log('🔍 Admin API: Token decrypted successfully')
    } catch (decryptError) {
      console.log('🔍 Admin API: Token decryption failed:', decryptError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user and check if admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (you can add role check here)
    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    // Fetch stats
    const [
      { count: totalUsers },
      { count: totalComments },
      { count: totalBookmarks },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
    ])

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get active users today (users with comments or bookmarks today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: activeCommentsToday } = await supabase
      .from('comments')
      .select('user_id')
      .gte('created_at', today.toISOString())
    
    const { data: activeBookmarksToday } = await supabase
      .from('bookmarks')
      .select('user_id')
      .gte('created_at', today.toISOString())

    const activeUserIds = new Set([
      ...(activeCommentsToday?.map(c => c.user_id) || []),
      ...(activeBookmarksToday?.map(b => b.user_id) || [])
    ])

    // Get total manhwa from metadata
    let totalManhwa = 0
    try {
      const metadataUrl = `${supabaseUrl}/storage/v1/object/public/komiku-data/metadata/metadata.json`
      const metadataResponse = await fetch(metadataUrl)
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json()
        totalManhwa = metadata.length || 0
      }
    } catch (error) {
      console.error('Error fetching manhwa count:', error)
    }

    const stats = {
      totalUsers: totalUsers || 0,
      totalManhwa,
      totalComments: totalComments || 0,
      totalBookmarks: totalBookmarks || 0,
      recentUsers: recentUsers || 0,
      activeToday: activeUserIds.size,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
