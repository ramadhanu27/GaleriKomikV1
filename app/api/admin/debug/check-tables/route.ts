import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET check if required tables exist
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check profiles table
    let profilesExists = false
    let profilesError = null
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_admin, is_premium, premium_expires_at')
        .limit(1)
      
      profilesExists = !error
      profilesError = error?.message
    } catch (e) {
      profilesError = e instanceof Error ? e.message : 'Unknown error'
    }

    // Test a simple insert/update to check if fields exist
    let fieldsExist = false
    let testError = null
    
    if (profilesExists) {
      try {
        // Try to update with admin/premium fields
        const { data: testData, error: testErr } = await supabase
          .from('profiles')
          .update({ 
            is_admin: false,
            is_premium: false,
            premium_expires_at: null 
          })
          .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID, just testing field validity
          .select()
        
        // We expect this to fail with "no rows" but not with syntax error
        fieldsExist = !testErr || testErr.code === 'PGRST116'
        testError = testErr?.message
      } catch (e) {
        testError = e instanceof Error ? e.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      profiles: {
        exists: profilesExists,
        error: profilesError
      },
      fields: {
        exist: fieldsExist,
        error: testError
      },
      recommendation: !profilesExists 
        ? "Create profiles table with required fields"
        : !fieldsExist 
        ? "Add missing fields to profiles table"
        : "Table and fields are correct"
    })

  } catch (error) {
    console.error('Error checking tables:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
