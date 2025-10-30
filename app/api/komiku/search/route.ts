import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase configuration is missing.' 
        },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const status = searchParams.get('status') || ''
    const withCover = searchParams.get('withCover') === 'true'

    // Get file list from Chapter/komiku folder using public URL approach
    console.log('Loading manhwa data from Chapter/komiku folder...')
    let manhwaList: any[] = []
    
    try {
      // Use metadata.json from metadata folder which contains full data
      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl('metadata/metadata.json')
      
      console.log('Fetching index file from:', urlData.publicUrl)
      
      // Retry logic with increased timeout
      let response
      let lastError
      const maxRetries = 3
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} to fetch index file...`)
          response = await fetch(urlData.publicUrl, { 
            cache: 'no-store',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })
          break // Success, exit retry loop
        } catch (err) {
          lastError = err
          console.error(`Attempt ${attempt} failed:`, err)
          if (attempt < maxRetries) {
            console.log(`Waiting 2 seconds before retry...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('Failed to fetch after retries')
      }
      
      if (response.ok) {
        manhwaList = await response.json()
        console.log(`Loaded ${manhwaList.length} manhwa from metadata.json with full data`)
        
        // metadata.json already has all data (image, synopsis, genres, status, type, totalChapters)
        // No need to load from individual JSON files!
        console.log('Sample data:', manhwaList[0] ? {
          slug: manhwaList[0].slug,
          hasImage: !!manhwaList[0].image,
          hasGenres: !!manhwaList[0].genres,
          hasStatus: !!manhwaList[0].status,
          hasType: !!manhwaList[0].type,
          hasTotalChapters: !!manhwaList[0].totalChapters
        } : 'No data')
      } else {
        // If metadata file doesn't exist, return helpful error
        console.log('Metadata file not found.')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Search metadata not available.',
            hint: 'File metadata.json must exist in metadata folder'
          },
          { status: 404 }
        )
      }
    } catch (err) {
      console.error('Error loading metadata file:', err)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to load search metadata',
          hint: 'Check if metadata/metadata.json exists in bucket komiku-data'
        },
        { status: 500 }
      )
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      manhwaList = manhwaList.filter((manhwa: any) =>
        manhwa.title?.toLowerCase().includes(searchLower) ||
        manhwa.manhwaTitle?.toLowerCase().includes(searchLower)
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

    // Filter by status
    if (status && status !== 'All') {
      manhwaList = manhwaList.filter((manhwa: any) => {
        const manhwaStatus = manhwa.status?.toLowerCase() || ''
        if (status === 'Complete') {
          return manhwaStatus.includes('complete') ||
                 manhwaStatus.includes('completed') ||
                 manhwaStatus === 'end'
        }
        return manhwaStatus.includes(status.toLowerCase())
      })
    }

    console.log(`Filtered to ${manhwaList.length} manhwa`)

    return NextResponse.json({
      success: true,
      data: {
        manhwa: manhwaList,
        total: manhwaList.length,
      },
    })
  } catch (error) {
    console.error('Error in search API route:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: `Internal server error: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}
