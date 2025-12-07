import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// POST create new manga
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Creating new manga:', JSON.stringify(body, null, 2))

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

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured'
      }, { status: 500 })
    }

    // Save to Supabase Storage
    try {
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      console.log('Attempting to upload to Supabase:', newManga.slug)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('komiku-data')
        .upload(`manga/${newManga.slug}.json`, JSON.stringify(mangaWithMetadata, null, 2), {
          contentType: 'application/json',
          upsert: true
        })

      if (error) {
        console.error('Supabase upload failed:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to save to Supabase: ${error.message}`
        }, { status: 500 })
      }

      console.log('Manga saved to Supabase:', newManga.slug, data)
      
      return NextResponse.json({
        success: true,
        message: 'Manga created successfully and saved to Supabase Storage',
        manga: mangaWithMetadata,
        storagePath: `manga/${newManga.slug}.json`,
        publicUrl: `${supabaseUrl}/storage/v1/object/public/komiku-data/manga/${newManga.slug}.json`
      })
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError)
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Supabase: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`
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

// GET check if manga slug exists
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

    // Check if manga exists in Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data, error } = await supabase.storage
        .from('komiku-data')
        .createSignedUrl(`manga/${slug}.json`, 60)
      
      if (error) {
        // Manga doesn't exist
        return NextResponse.json({
          success: true,
          exists: false,
          message: 'Slug is available'
        })
      }
      
      return NextResponse.json({
        success: true,
        exists: true,
        message: 'Slug already exists',
        signedUrl: data.signedUrl
      })
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
