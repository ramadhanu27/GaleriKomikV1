import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Enable edge caching for 30 minutes (1800 seconds)
// Shorter cache for search to keep results relatively fresh
export const revalidate = 1800

// In-memory cache for metadata (to avoid re-fetching large file)
let cachedMetadata: any[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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

    let manhwaList: any[] = []
    
    // Check cache first
    const now = Date.now()
    if (cachedMetadata && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('✅ Using cached metadata for search')
      manhwaList = cachedMetadata
    } else {
      console.log('📥 Fetching metadata.json for search...')
      
      try {
        // Use metadata.json from metadata folder which contains full data
        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl('metadata/metadata.json')
        
        // Retry logic with increased timeout
        let response
        let lastError
        const maxRetries = 3
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt}/${maxRetries} to fetch metadata.json (11MB)...`)
            response = await fetch(urlData.publicUrl, { 
              next: { revalidate: 1800 },
              headers: { 
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
              },
              signal: AbortSignal.timeout(120000) // 120 second timeout for 11MB file
            })
            
            if (response.ok) {
              console.log(`✅ Successfully fetched metadata.json on attempt ${attempt}`)
              break
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
          } catch (err) {
            lastError = err
            console.error(`Attempt ${attempt} failed:`, err)
            if (attempt < maxRetries) {
              const waitTime = attempt * 2000
              console.log(`Waiting ${waitTime}ms before retry...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
            }
          }
        }
        
        if (!response || !response.ok) {
          throw lastError || new Error('Failed to fetch after retries')
        }
        
        // Use streaming for large file (11MB+)
        if (response.body) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let chunks = ''

          console.log('📥 Streaming metadata.json...')
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            chunks += decoder.decode(value, { stream: true })
          }

          manhwaList = JSON.parse(chunks)
          console.log(`✅ Parsed ${manhwaList.length} manhwa from metadata.json`)
          
          // Cache the result
          cachedMetadata = manhwaList
          cacheTimestamp = Date.now()
          console.log('💾 Metadata cached for search')
        } else {
          manhwaList = await response.json()
        }
      } catch (err) {
        console.error('Error loading metadata file:', err)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to load search metadata',
            details: err instanceof Error ? err.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
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

    // Format response to match list-from-files format
    const formattedList = manhwaList.map((m: any) => ({
      slug: m.slug,
      title: m.manhwaTitle || m.title,
      image: m.image,
      synopsis: m.synopsis || '',
      genres: m.genres || [],
      status: m.status || 'Unknown',
      type: m.type || 'Manhwa',
      rating: m.rating ? parseFloat(m.rating) : null,
      totalChapters: m.totalChapters || m.chapters?.length || 0,
      lastTwoChapters: (m.chapters || [])
        .slice(-2)
        .reverse()
        .map((ch: any) => ({
          title: ch.title,
          url: ch.url,
          date: ch.date,
        })),
    }))

    return NextResponse.json({
      success: true,
      data: {
        manhwa: formattedList,
        total: formattedList.length,
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
