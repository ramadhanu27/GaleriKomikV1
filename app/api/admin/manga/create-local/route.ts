import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Define manga data interface
interface NewMangaData {
  slug: string
  title: string
  alternativeTitle?: string
  url?: string
  image?: string
  author?: string
  type?: string
  status?: string
  released?: string
  genres?: string[]
  synopsis?: string
  totalChapters?: number
}

// POST create new manga (local save for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Creating new manga (local):', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.slug || !body.title) {
      return NextResponse.json({
        success: false,
        error: 'Slug and title are required'
      }, { status: 400 })
    }

    // Create manga data with defaults
    const newManga: NewMangaData = {
      slug: body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: body.title,
      alternativeTitle: body.alternativeTitle || '',
      url: body.url || '',
      image: body.image || '',
      author: body.author || '',
      type: body.type || 'Manga',
      status: body.status || 'Ongoing',
      released: body.released || '',
      genres: Array.isArray(body.genres) ? body.genres : [],
      synopsis: body.synopsis || '',
      totalChapters: body.totalChapters || 0
    }

    // Add metadata
    const mangaWithMetadata = {
      ...newManga,
      scrapedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      rating: null,
      lastTwoChapters: []
    }

    // Save to local file system
    try {
      const dataDir = join(process.cwd(), 'data', 'manga')
      mkdirSync(dataDir, { recursive: true })
      
      const filePath = join(dataDir, `${newManga.slug}.json`)
      writeFileSync(filePath, JSON.stringify(mangaWithMetadata, null, 2))
      
      console.log('Manga saved to local file:', filePath)
      
      return NextResponse.json({
        success: true,
        message: 'Manga created successfully and saved to local file',
        manga: mangaWithMetadata,
        filePath: `/data/manga/${newManga.slug}.json`
      })
    } catch (fileError) {
      console.error('Error saving to local file:', fileError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save manga file'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating manga:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET check if manga slug exists (local)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Slug parameter is required'
      }, { status: 400 })
    }

    // Check if manga exists in local files
    try {
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'data', 'manga', `${slug}.json`)
      
      if (fs.existsSync(filePath)) {
        return NextResponse.json({
          success: true,
          exists: true,
          message: 'Slug already exists'
        })
      } else {
        return NextResponse.json({
          success: true,
          exists: false,
          message: 'Slug is available'
        })
      }
    } catch (checkError) {
      console.error('Error checking slug:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check slug availability'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in GET request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
