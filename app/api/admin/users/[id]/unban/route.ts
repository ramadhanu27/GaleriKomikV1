import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// POST - Unban user
export async function POST(
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

    // Remove ban record
    const { error } = await supabase
      .from('user_bans')
      .delete()
      .eq('user_id', params.id)

    if (error) {
      console.error('Error unbanning user:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to unban user' },
        { status: 500 }
      )
    }

    // Note: Supabase doesn't support banned_until in AdminUserAttributes
    // Unban is enforced through our user_bans table
    // The user will be checked for bans in auth middleware

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully'
    })
  } catch (error) {
    console.error('Error in user unban POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
