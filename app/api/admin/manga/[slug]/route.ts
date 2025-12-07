import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

interface MangaDetail {
  slug: string
  title: string
  manhwaTitle?: string
  alternativeTitle?: string
  url: string
  manhwaUrl?: string
  image: string
  author: string
  type: string
  status: string
  released: string
  genres: string[]
  synopsis: string
  totalChapters: number
  scrapedAt: string
  lastUpdated?: string
  chapters?: any[]
}

// GET manga detail by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cookieStore = require('next/headers').cookies
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value
    let accessToken: string
    
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl!, supabaseKey!)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const { slug } = params

    // Get manga from list-from-files API
    const listResponse = await fetch('http://localhost:3000/api/komiku/list-from-files')
    if (!listResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch manga list' },
        { status: 500 }
      )
    }

    const listData = await listResponse.json()
    const manga = listData.data.manhwa.find((m: any) => m.slug === slug)
    
    if (!manga) {
      return NextResponse.json(
        { success: false, error: 'Manga not found' },
        { status: 404 }
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

// PUT update manga
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cookieStore = require('next/headers').cookies
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value
    let accessToken: string
    
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl!, supabaseKey!)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

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
      title: body.title || currentManga.title || currentManga.manhwaTitle,
      manhwaTitle: body.manhwaTitle || currentManga.manhwaTitle || currentManga.title,
      alternativeTitle: body.alternativeTitle || currentManga.alternativeTitle,
      url: body.url || currentManga.url || currentManga.manhwaUrl,
      manhwaUrl: body.manhwaUrl || currentManga.manhwaUrl || currentManga.url,
      image: body.image || currentManga.image,
      author: body.author || currentManga.author,
      type: body.type || currentManga.type,
      status: body.status || currentManga.status,
      released: body.released || currentManga.released,
      genres: Array.isArray(body.genres) ? body.genres : currentManga.genres,
      synopsis: body.synopsis || currentManga.synopsis,
      totalChapters: body.totalChapters || currentManga.totalChapters,
      lastUpdated: new Date().toISOString()
    }

    // For now, just return success (actual file editing would require more complex setup)
    console.log('Manga updated:', updatedManga)

    return NextResponse.json({
      success: true,
      message: 'Manga updated successfully (Note: File editing requires additional setup)',
      manga: updatedManga
    })
  } catch (error) {
    console.error('Error updating manga:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
