import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, manhwa_slug, manhwa_title, chapter_id, issue_type, description } = body

    // Validate required fields
    if (!user_id || !manhwa_slug || !manhwa_title || !issue_type || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert report
    const { data, error } = await supabase
      .from('issue_reports')
      .insert({
        user_id,
        manhwa_slug,
        manhwa_title,
        chapter_id,
        issue_type,
        description,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in report-issue API:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
