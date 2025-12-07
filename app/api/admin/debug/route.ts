import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Debug environment variables
    const envDebug = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET'
    }

    // Test different table names
    const tables = ['komiku_data', 'komiku_list', 'manhwa', 'manga']
    const results = {}

    for (const table of tables) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=slug,title&limit=5`, {
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey!}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          results[table] = { success: true, count: data.length, sample: data }
        } else {
          results[table] = { success: false, status: response.status, error: await response.text() }
        }
      } catch (error) {
        results[table] = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    // Also test the list-from-files API
    try {
      const listResponse = await fetch(`${supabaseUrl}/functions/v1/komiku/list-from-files`, {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey!}`
        }
      })
      
      if (listResponse.ok) {
        const listData = await listResponse.json()
        results['list-from-files'] = { success: true, structure: Object.keys(listData) }
      } else {
        results['list-from-files'] = { success: false, status: listResponse.status }
      }
    } catch (error) {
      results['list-from-files'] = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }

    return NextResponse.json({
      success: true,
      envDebug,
      results
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
