import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  banned: boolean
  ban_reason?: string
  banned_at?: string
  total_bookmarks?: number
  total_comments?: number
}

// GET - Fetch all users
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

    // Fetch all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching users:', authError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get banned users from our custom table
    let bannedUsers = []
    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
      
      if (!error && data) {
        bannedUsers = data
      }
    } catch (err) {
      console.error('Error fetching banned users:', err)
    }

    // Get user activity stats
    let bookmarkStats = { data: {} }
    try {
      const result = await supabase
        .from('bookmarks')
        .select('user_id')
      
      if (!result.error && result.data) {
        const stats = result.data.reduce((acc, item) => {
          const userId = item.user_id?.toString() || item.user_id
          acc[userId] = (acc[userId] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        bookmarkStats = { data: stats }
      }
    } catch (err) {
      console.error('Error fetching bookmark stats:', err)
    }

    let commentStats = { data: {} }
    try {
      const result = await supabase
        .from('comments')
        .select('user_id')
      
      if (!result.error && result.data) {
        const stats = result.data.reduce((acc, item) => {
          const userId = item.user_id?.toString() || item.user_id
          acc[userId] = (acc[userId] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        commentStats = { data: stats }
      }
    } catch (err) {
      console.error('Error fetching comment stats:', err)
    }

    // Combine data
    const users: User[] = authUsers.users.map(authUser => {
      const banInfo = bannedUsers?.find(ban => ban.user_id === authUser.id)
      
      return {
        id: authUser.id,
        email: authUser.email || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        banned: !!banInfo,
        ban_reason: banInfo?.reason,
        banned_at: banInfo?.created_at,
        total_bookmarks: (bookmarkStats?.data as unknown as Record<string, number>)[authUser.id] || 0,
        total_comments: (commentStats?.data as unknown as Record<string, number>)[authUser.id] || 0
      }
    })

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error in users GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
