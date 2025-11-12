import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface Comment {
  id: string
  user_id: string
  user_email: string
  manhwa_slug: string
  manhwa_title: string
  content: string
  created_at: string
  status: 'approved' | 'pending' | 'deleted'
  reported: boolean
  report_count: number
}

// GET - Fetch all comments
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

    // Fetch comments (simple query without relationship)
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // Get report counts
    const { data: reports } = await supabase
      .from('comment_reports')
      .select('comment_id')

    const reportCounts = reports?.reduce((acc, report) => {
      acc[report.comment_id] = (acc[report.comment_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get reported comment IDs
    const reportedCommentIds = new Set(reports?.map(r => r.comment_id) || [])

    // Transform data
    const transformedComments: Comment[] = (comments || []).map(comment => ({
      id: comment.id,
      user_id: comment.user_id,
      user_email: comment.user?.email || 'Unknown',
      manhwa_slug: comment.manhwa_slug,
      manhwa_title: comment.manhwa_title || 'Unknown Manhwa',
      content: comment.content,
      created_at: comment.created_at,
      status: comment.status || 'pending',
      reported: reportedCommentIds.has(comment.id),
      report_count: reportCounts[comment.id] || 0
    }))

    return NextResponse.json({
      success: true,
      comments: transformedComments
    })
  } catch (error) {
    console.error('Error in comments GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
