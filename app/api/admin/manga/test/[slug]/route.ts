import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET manga detail by slug (test version)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Try to get manga from individual JSON file first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let manga = null
    
    try {
      const fileResponse = await fetch(`${supabaseUrl}/storage/v1/object/public/komiku-data/manga/${slug}.json`)
      if (fileResponse.ok) {
        manga = await fileResponse.json()
        console.log('Manga loaded from individual file:', slug)
      }
    } catch (fileError) {
      console.log('Individual file not found, trying metadata...')
    }
    
    // Fallback to list-from-files API if individual file doesn't exist
    if (!manga) {
      const listResponse = await fetch('http://localhost:3000/api/komiku/list-from-files')
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

// PUT update manga (test version)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()

    // Get current manga data from list-from-files API
    const listResponse = await fetch('http://localhost:3000/api/komiku/list-from-files')
    if (!listResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch manga list' },
        { status: 500 }
      )
    }

    const listData = await listResponse.json()
    const currentManga = listData.data.manhwa.find((m: any) => m.slug === slug)
    
    if (!currentManga) {
      return NextResponse.json(
        { success: false, error: 'Manga not found' },
        { status: 404 }
      )
    }

    // Update manga with new data
    const updatedManga = {
      ...currentManga,
      title: body.title !== undefined && body.title !== "" ? body.title : (currentManga.title || currentManga.manhwaTitle),
      manhwaTitle: body.manhwaTitle !== undefined && body.manhwaTitle !== "" ? body.manhwaTitle : (currentManga.manhwaTitle || currentManga.title),
      alternativeTitle: body.alternativeTitle !== undefined && body.alternativeTitle !== "" ? body.alternativeTitle : currentManga.alternativeTitle,
      url: body.url !== undefined && body.url !== "" ? body.url : (currentManga.url || currentManga.manhwaUrl),
      manhwaUrl: body.manhwaUrl !== undefined && body.manhwaUrl !== "" ? body.manhwaUrl : (currentManga.manhwaUrl || currentManga.url),
      image: body.image !== undefined && body.image !== "" ? body.image : currentManga.image,
      author: body.author !== undefined && body.author !== "" ? body.author : currentManga.author,
      type: body.type !== undefined && body.type !== "" ? body.type : currentManga.type,
      status: body.status !== undefined && body.status !== "" ? body.status : currentManga.status,
      released: body.released !== undefined && body.released !== "" ? body.released : currentManga.released,
      genres: Array.isArray(body.genres) && body.genres.length > 0 ? body.genres : currentManga.genres,
      synopsis: body.synopsis !== undefined && body.synopsis !== "" ? body.synopsis : currentManga.synopsis,
      totalChapters: body.totalChapters !== undefined && body.totalChapters !== null ? body.totalChapters : currentManga.totalChapters,
      lastUpdated: new Date().toISOString()
    }

    // Save updated manga to Supabase Storage
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Upload updated manga JSON to Supabase Storage
      const { data, error } = await supabase.storage
        .from('komiku-data')
        .upload(`manga/${slug}.json`, JSON.stringify(updatedManga, null, 2), {
          contentType: 'application/json',
          upsert: true
        })

      if (error) {
        console.error('Upload failed:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to save manga file: ${error.message}`
        }, { status: 500 })
      }

      console.log('Manga saved to storage:', slug, data)
      
      return NextResponse.json({
        success: true,
        message: 'Manga updated and saved successfully to Supabase Storage',
        manga: updatedManga
      })
    } catch (saveError) {
      console.error('Error saving manga:', saveError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save manga data'
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
