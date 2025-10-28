import { NextResponse } from 'next/server'
import { supabase, SUPABASE_BUCKET } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // List all files in Chapter/komiku folder
    const { data: files, error: listError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list('Chapter/komiku', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to list files: ${listError.message}` 
        },
        { status: 500 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No manhwa files found' 
        },
        { status: 404 }
      )
    }

    console.log(`Found ${files.length} manhwa files`)

    // Filter JSON files and sort by updated_at (newest first)
    const jsonFiles = files
      .filter(file => file.name.endsWith('.json'))
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
        return dateB - dateA // Newest first
      })
      .slice(0, limit) // Take top N after sorting

    console.log('Top 5 files by updated_at:')
    jsonFiles.slice(0, 5).forEach((f, i) => {
      console.log(`${i + 1}. ${f.name} - ${f.updated_at}`)
    })

    // Fetch all JSON files and extract data
    const manhwaPromises = jsonFiles
      .map(async (file) => {
        try {
          const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .download(`Chapter/komiku/${file.name}`)

          if (error || !data) {
            console.error(`Error downloading ${file.name}:`, error)
            return null
          }

          const text = await data.text()
          const json = JSON.parse(text)

          // Sort chapters by number descending to get latest chapters
          const sortedChapters = json.chapters 
            ? [...json.chapters].sort((a: any, b: any) => {
                const numA = parseInt(a.number) || 0
                const numB = parseInt(b.number) || 0
                return numB - numA // Descending (latest first)
              })
            : []

          // Extract basic info for list
          return {
            slug: json.slug || file.name.replace('.json', ''),
            title: json.manhwaTitle || json.title,
            image: json.image,
            synopsis: json.synopsis,
            genres: json.genres,
            status: json.status,
            type: json.type,
            rating: json.rating,
            totalChapters: json.totalChapters || json.chapters?.length || 0,
            scrapedAt: json.scrapedAt,
            lastModified: json.scrapedAt, // Use scrapedAt as lastModified
            chapters: sortedChapters.slice(0, 3), // Include latest 3 chapters for preview
          }
        } catch (error) {
          console.error(`Error parsing ${file.name}:`, error)
          return null
        }
      })

    const manhwaList = (await Promise.all(manhwaPromises))
      .filter(m => m !== null) // Remove failed fetches

    // Sort by scrapedAt (newest first)
    manhwaList.sort((a, b) => {
      const dateA = a.scrapedAt ? new Date(a.scrapedAt).getTime() : 0
      const dateB = b.scrapedAt ? new Date(b.scrapedAt).getTime() : 0
      return dateB - dateA
    })

    console.log(`Successfully loaded ${manhwaList.length} manhwa`)
    console.log('Top 5 by scrapedAt:')
    manhwaList.slice(0, 5).forEach((m, i) => {
      console.log(`${i + 1}. ${m.title} - ${m.scrapedAt}`)
    })

    return NextResponse.json({
      success: true,
      data: {
        manhwa: manhwaList,
        total: manhwaList.length,
      },
    })
  } catch (error: any) {
    console.error('Error in list-from-files:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}
