import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET check profiles table schema
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

    // Check if profiles table exists and get schema
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (tablesError) {
      console.error('Error accessing profiles table:', tablesError)
      return NextResponse.json({
        success: false,
        error: `Profiles table error: ${tablesError.message}`,
        details: tablesError.details,
        code: tablesError.code
      }, { status: 500 })
    }

    // Get table schema using raw SQL
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'profiles' })

    console.log('Profiles table accessible, sample data:', tables)

    return NextResponse.json({
      success: true,
      message: 'Profiles table is accessible',
      hasData: tables && tables.length > 0,
      sampleData: tables ? tables[0] : null,
      schema: schema || 'Schema query not available'
    })

  } catch (error) {
    console.error('Error checking profiles schema:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
