import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Force dynamic rendering (required for request.url usage)
export const dynamic = 'force-dynamic'

// Disable edge caching to prevent stale data
export const revalidate = 0

// Increase max duration for Vercel (60s for Pro, 10s for Hobby)
export const maxDuration = 60

// In-memory cache for metadata (to avoid re-fetching large file)
// DISABLED temporarily to debug - cache was storing partial data
let cachedMetadata: any[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 0 // Disabled: was 5 * 60 * 1000

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
    
    // Check cache first (DISABLED - CACHE_DURATION = 0)
    const now = Date.now()
    console.log(`🔍 Cache check: cachedMetadata=${!!cachedMetadata}, age=${cachedMetadata ? Math.round((now - cacheTimestamp) / 1000) : 'N/A'}s, duration=${CACHE_DURATION}ms`)
    
    if (cachedMetadata && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`✅ Using cached metadata for search (${cachedMetadata.length} items)`)
      manhwaList = cachedMetadata
    } else {
      console.log('📥 Fetching metadata.json for search (cache disabled or expired)...')
      
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
        try {
          if (response.body) {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let chunks = ''

            console.log('📥 Streaming metadata.json...')
            let chunkCount = 0
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              chunks += decoder.decode(value, { stream: true })
              chunkCount++
              
              // Log progress every 50 chunks
              if (chunkCount % 50 === 0) {
                console.log(`📦 Received ${chunkCount} chunks (${Math.round(chunks.length / 1024 / 1024 * 100) / 100} MB)`)
              }
            }

            console.log(`✅ Streaming complete: ${chunkCount} chunks, ${Math.round(chunks.length / 1024 / 1024 * 100) / 100} MB`)
            console.log('🔍 Parsing JSON...')
            
            manhwaList = JSON.parse(chunks)
            console.log(`✅ Parsed ${manhwaList.length} manhwa from metadata.json`)
            console.log(`📊 First 3 items: ${manhwaList.slice(0, 3).map((m: any) => m.slug || m.title).join(', ')}`)
            
            // Cache the result
            cachedMetadata = manhwaList
            cacheTimestamp = Date.now()
            console.log('💾 Metadata cached for search')
          } else {
            console.log('⚠️ No response.body, using regular JSON parsing...')
            manhwaList = await response.json()
            console.log(`✅ Parsed ${manhwaList.length} manhwa (non-streaming)`)
            
            // Cache the result
            cachedMetadata = manhwaList
            cacheTimestamp = Date.now()
          }
        } catch (parseError) {
          console.error('❌ Failed to parse metadata.json:', parseError)
          throw new Error(`Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`)
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

    console.log(`📊 Before filtering: ${manhwaList.length} manhwa`)

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      console.log(`🔍 Filtering by search: "${search}"`)
      manhwaList = manhwaList.filter((manhwa: any) =>
        manhwa.title?.toLowerCase().includes(searchLower) ||
        manhwa.manhwaTitle?.toLowerCase().includes(searchLower)
      )
      console.log(`📊 After search filter: ${manhwaList.length} manhwa`)
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

    console.log(`📊 Search results: ${manhwaList.length} manhwa (search: "${search}", genre: "${genre}", status: "${status}")`)

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

    console.log(`✅ Returning ${formattedList.length} manhwa to client`)

    return NextResponse.json({
      success: true,
      data: {
        manhwa: formattedList,
        total: formattedList.length,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
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
