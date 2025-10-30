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
      // Use a pre-generated index file if available, otherwise return error
      // This API expects a komiku-list.json file to exist for fast search
      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl('komiku-list.json')
      
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
        console.log(`Loaded ${manhwaList.length} manhwa from index file`)
        
        // Load covers FIRST before filtering (with batching to avoid timeout)
        if (withCover && manhwaList.length > 0) {
          console.log('Loading cover images before filtering...')
          
          const batchSize = 20 // Process 20 items at a time
          const maxCoversToLoad = Math.min(manhwaList.length, 500) // Load up to 500 items
          const itemsToLoad = manhwaList.slice(0, maxCoversToLoad)
          
          console.log(`Loading covers for ${itemsToLoad.length} items in batches of ${batchSize}`)
          
          const loadedCovers: any[] = []
          
          // Process in batches
          for (let i = 0; i < itemsToLoad.length; i += batchSize) {
            const batch = itemsToLoad.slice(i, i + batchSize)
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemsToLoad.length / batchSize)}`)
            
            const batchPromises = batch.map(async (manhwa: any) => {
              try {
                const { data: urlData } = supabase.storage
                  .from(SUPABASE_BUCKET)
                  .getPublicUrl(`Chapter/komiku/${manhwa.slug}.json`)
                
                const response = await fetch(urlData.publicUrl, {
                  cache: 'no-store',
                  headers: { 'User-Agent': 'Mozilla/5.0' }
                })
                
                if (response.ok) {
                  const jsonData = await response.json()
                  return {
                    ...manhwa,
                    coverImage: jsonData.image || manhwa.image,
                    image: jsonData.image || manhwa.image,
                    fullSynopsis: jsonData.synopsis || manhwa.synopsis,
                    synopsis: jsonData.synopsis || manhwa.synopsis,
                    genres: jsonData.genres || manhwa.genres || [],
                    totalChapters: jsonData.totalChapters || manhwa.totalChapters || 0,
                    status: jsonData.status || manhwa.status || 'Unknown',
                    type: jsonData.type || manhwa.type || 'Manhwa',
                    chapters: jsonData.chapters || []
                  }
                }
              } catch (err) {
                console.error(`Error loading cover for ${manhwa.slug}:`, err)
              }
              return manhwa
            })
            
            const batchResults = await Promise.all(batchPromises)
            loadedCovers.push(...batchResults)
            
            // Small delay between batches to avoid overwhelming the server
            if (i + batchSize < itemsToLoad.length) {
              await new Promise(resolve => setTimeout(resolve, 50))
            }
          }
          
          console.log(`Successfully loaded ${loadedCovers.length} covers`)
          
          // Replace loaded items with their cover data
          manhwaList = [
            ...loadedCovers,
            ...manhwaList.slice(maxCoversToLoad)
          ]
        }
      } else {
        // If index file doesn't exist, return helpful error
        console.log('Index file not found. Please generate komiku-list.json first.')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Search index not available.',
            hint: 'File komiku-list.json must exist in bucket komiku-data'
          },
          { status: 404 }
        )
      }
    } catch (err) {
      console.error('Error loading index file:', err)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to load search index',
          hint: 'Check if komiku-list.json exists in bucket komiku-data'
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
