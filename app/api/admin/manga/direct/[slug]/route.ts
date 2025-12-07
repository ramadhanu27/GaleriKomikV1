import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Define manga data interface
interface MangaData {
  slug: string
  title?: string
  author?: string
  status?: string
  alternativeTitle?: string
  url?: string
  manhwaUrl?: string
  image?: string
  type?: string
  released?: string
  genres?: string[]
  synopsis?: string
  totalChapters?: number
  lastUpdated: string
}

// PUT update manga - direct save without merge
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    let body = {}
    try {
      const rawBody = await request.text()
      console.log('Raw body received:', rawBody)
      body = JSON.parse(rawBody)
      console.log('Parsed body:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('Error parsing body:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    // Skip fetching base data for faster save - direct save only
    // This makes save operation much faster by avoiding API calls

    // Create final manga data - ONLY request body + required fields
    const finalManga: MangaData = {
      slug,
      ...body,
      lastUpdated: new Date().toISOString()
    }
    
    console.log('Final manga data:', JSON.stringify({
      title: finalManga.title,
      author: finalManga.author,
      status: finalManga.status
    }, null, 2))

    // Save to local file system
    try {
      const dataDir = join(process.cwd(), 'data', 'manga')
      mkdirSync(dataDir, { recursive: true })
      
      const filePath = join(dataDir, `${slug}.json`)
      writeFileSync(filePath, JSON.stringify(finalManga, null, 2))
      
      console.log('Manga saved to local file:', filePath)
      
      return NextResponse.json({
        success: true,
        message: 'Manga saved successfully to local file',
        manga: finalManga,
        filePath: `/data/manga/${slug}.json`,
        savedAt: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache', // Don't cache save responses
          'X-Save-Status': 'success'
        }
      })
    } catch (fileError) {
      console.error('Error saving to local file:', fileError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save manga file'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating manga:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET manga detail by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Try to get manga from local file first (fastest)
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'manga', `${slug}.json`)
    
    let manga: any = null
    
    try {
      // Fast synchronous file check
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        manga = JSON.parse(fileContent)
        console.log('Manga loaded from local file (fast):', slug)
        
        // Return immediately if found in local file
        return NextResponse.json({
          success: true,
          manga,
          source: 'local-file'
        }, {
          headers: {
            'Cache-Control': 'private, max-age=60', // Cache for 1 minute
            'X-Data-Source': 'local-file'
          }
        })
      }
    } catch (fileError) {
      console.log('Local file error, trying metadata...')
    }
    
    // Only fetch from API if local file doesn't exist
    try {
      // Use cached metadata API for faster response
      const listResponse = await fetch('http://localhost:3000/api/komiku/list-from-files', {
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutes cache
        }
      })
      
      if (!listResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch manga list' },
          { status: 500 }
        )
      }

      const listData = await listResponse.json()
      manga = listData.data.manhwa.find((m: any) => m.slug === slug)
      
      if (!manga) {
        return NextResponse.json(
          { success: false, error: 'Manga not found' },
          { status: 404 }
        )
      }
      
      console.log('Manga loaded from metadata:', slug)
      
      return NextResponse.json({
        success: true,
        manga,
        source: 'metadata-api'
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
          'X-Data-Source': 'metadata-api'
        }
      })
    } catch (apiError) {
      console.error('API fetch error:', apiError)
      return NextResponse.json(
        { success: false, error: 'Failed to load manga data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      manga
    })
  } catch (error) {
    console.error('Error fetching manga detail:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
