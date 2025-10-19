import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
    const withCovers = searchParams.get('withCovers') === 'true'

    // Try to get public URL for komiku-list.json (try both paths)
    let response: Response
    let publicUrl: string
    
    // Try path with komiku folder first
    const { data: urlData1 } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl('komiku/komiku-list.json')
    
    console.log('Trying URL 1:', urlData1?.publicUrl)
    response = await fetch(urlData1.publicUrl)
    console.log('Response status 1:', response.status)
    
    // If failed, try root path
    if (!response.ok) {
      const { data: urlData2 } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl('komiku-list.json')
      
      console.log('Trying URL 2:', urlData2?.publicUrl)
      response = await fetch(urlData2.publicUrl)
      console.log('Response status 2:', response.status)
      publicUrl = urlData2.publicUrl
    } else {
      publicUrl = urlData1.publicUrl
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch file from both paths. Status: ${response.status} ${response.statusText}. URLs tried: ${urlData1.publicUrl} and ${publicUrl}` 
        },
        { status: 500 }
      )
    }
    
    console.log('Successfully fetched from:', publicUrl)

    const text = await response.text()
    let manhwaList = JSON.parse(text)

    // Filter by search query (on original list)
    if (search) {
      manhwaList = manhwaList.filter((manhwa: any) =>
        manhwa.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Pagination FIRST (to limit data to load)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedList = manhwaList.slice(startIndex, endIndex)

    // Optionally fetch cover images from chapter JSON
    if (withCovers) {
      // Batch process in chunks of 10 for better performance
      const chunkSize = 10
      const chunks = []
      for (let i = 0; i < paginatedList.length; i += chunkSize) {
        chunks.push(paginatedList.slice(i, i + chunkSize))
      }

      const listWithCovers = []
      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (manhwa: any) => {
            try {
              const { data: chapterData } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .download(`Chapter/komiku/${manhwa.slug}.json`)
              
              if (chapterData) {
                const chapterText = await chapterData.text()
                const chapterJson = JSON.parse(chapterText)
                
                // Override with chapter JSON data if available
                return {
                  ...manhwa,
                  image: chapterJson.image || manhwa.image,
                  manhwaTitle: chapterJson.manhwaTitle || manhwa.title,
                  chapters: chapterJson.chapters || [],
                  genres: chapterJson.genres || manhwa.genres,
                  status: chapterJson.status || manhwa.status,
                  lastModified: new Date().toISOString(), // Use current date as fallback
                }
              }
            } catch (err) {
              // If chapter JSON not found, use original data silently
            }
            return manhwa
          })
        )
        listWithCovers.push(...chunkResults)
      }

      // Filter by genre after loading chapter data
      let finalList = listWithCovers
      if (genre) {
        const genreSearch = genre.toLowerCase().trim()
        finalList = finalList.filter((manhwa: any) =>
          manhwa.genres?.some((g: string) => 
            g.toLowerCase().trim() === genreSearch ||
            g.toLowerCase().trim().includes(genreSearch)
          )
        )
      }
      
      return NextResponse.json({
        success: true,
        data: {
          manhwa: finalList,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(manhwaList.length / limit),
            totalItems: manhwaList.length,
            itemsPerPage: limit,
          },
        },
      })
    }

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
