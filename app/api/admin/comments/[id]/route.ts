import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// DELETE - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Update comment status to deleted (soft delete)
    const { error } = await supabase
      .from('comments')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    // Remove any reports for this comment
    await supabase
      .from('comment_reports')
      .delete()
      .eq('comment_id', params.id)

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Error in comment DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
