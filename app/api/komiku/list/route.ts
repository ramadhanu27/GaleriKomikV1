import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Enable edge caching for 1 hour (3600 seconds)
export const revalidate = 3600

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.' 
        },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''

    // Try to fetch from komiku-list.json first (faster)
    console.log('Fetching manhwa list from komiku-list.json...')
    let manhwaList: any[] = []
    
    try {
      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl('komiku/komiku-list.json')
      
      const response = await fetch(urlData.publicUrl, { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      
      if (response.ok) {
        manhwaList = await response.json()
        console.log(`Loaded ${manhwaList.length} manhwa from komiku-list.json`)
      } else {
        console.log('komiku-list.json not found, will return empty')
        manhwaList = []
      }
    } catch (err) {
      console.error('Error loading komiku-list.json:', err)
      manhwaList = []
    }

    // Filter by search query (on original list)
    if (search) {
      manhwaList = manhwaList.filter((manhwa: any) =>
        manhwa.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filter by genre
    if (genre) {
      const genreSearch = genre.toLowerCase().trim()
      manhwaList = manhwaList.filter((manhwa: any) =>
        manhwa.genres?.some((g: string) => 
          g.toLowerCase().trim() === genreSearch ||
          g.toLowerCase().trim().includes(genreSearch)
        )
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedList = manhwaList.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        manhwa: paginatedList,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(manhwaList.length / limit),
          totalItems: manhwaList.length,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error('Error in API route:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${errorMessage}`,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
