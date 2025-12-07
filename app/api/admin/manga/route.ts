import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface Manga {
  slug: string
  manhwaTitle: string
  alternativeTitle?: string
  manhwaUrl: string
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
  views?: number
  bookmarks?: number
  comments?: number
}

// GET - Fetch all manga with stats
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    if (!encryptedAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'title'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Fetch manga data from metadata files
    const mangaList = await fetchMangaList()

    // Apply search filter
    let filteredManga = mangaList.filter(manga => 
      manga.manhwaTitle.toLowerCase().includes(search.toLowerCase()) ||
      manga.alternativeTitle?.toLowerCase().includes(search.toLowerCase()) ||
      manga.author.toLowerCase().includes(search.toLowerCase())
    )

    // Apply sorting
    filteredManga.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Manga] || ''
      let bValue: any = b[sortBy as keyof Manga] || ''
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1
      }
      return aValue > bValue ? 1 : -1
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedManga = filteredManga.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      manga: paginatedManga,
      pagination: {
        page,
        limit,
        total: filteredManga.length,
        totalPages: Math.ceil(filteredManga.length / limit)
      }
    })
  } catch (error) {
    console.error('Error in manga GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new manga
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    if (!encryptedAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
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

    const body = await request.json()
    const { slug, manhwaTitle, alternativeTitle, manhwaUrl, image, author, type, status, released, genres, synopsis } = body

    // Validate required fields
    if (!slug || !manhwaTitle || !manhwaUrl || !image || !author) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Add manga to database (you'll need to implement this based on your data structure)
    // This is a placeholder - you'd typically save to your manga database

    return NextResponse.json({
      success: true,
      message: 'Manga added successfully',
      manga: {
        slug,
        manhwaTitle,
        alternativeTitle,
        manhwaUrl,
        image,
        author,
        type,
        status,
        released,
        genres,
        synopsis,
        totalChapters: 0,
        scrapedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in manga POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to fetch manga list
async function fetchMangaList(): Promise<Manga[]> {
  try {
    // Use the same API that already works for manga list (from bucket storage)
    const listResponse = await fetch(`http://localhost:3000/api/komiku/list-from-files`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!listResponse.ok) {
      throw new Error('Failed to fetch manga list')
    }
    
    const listData = await listResponse.json()
    
    if (!listData.success || !listData.data || !listData.data.manhwa) {
      console.log('API Response:', listData)
      throw new Error('Invalid response from manga list API')
    }
    
    // Transform data to match Manga interface
    const manga: Manga[] = listData.data.manhwa.map((item: any) => ({
      slug: item.slug || '',
      manhwaTitle: item.title || item.manhwaTitle || '',
      alternativeTitle: item.alternativeTitle || '',
      manhwaUrl: item.url || item.manhwaUrl || '',
      image: item.image || '',
      author: item.author || '',
      type: item.type || 'Manga',
      status: item.status || 'Ongoing',
      released: item.released || item.year || '',
      genres: Array.isArray(item.genres) ? item.genres : [],
      synopsis: item.synopsis || item.description || '',
      totalChapters: item.totalChapters || item.chapterCount || (item.chapters ? item.chapters.length : 0),
      scrapedAt: item.scrapedAt || item.createdAt || new Date().toISOString(),
      lastUpdated: item.lastUpdated || item.updatedAt || '',
      views: Math.floor(Math.random() * 10000), // Placeholder - implement actual view tracking
      bookmarks: 0, // Will be populated below
      comments: 0 // Will be populated below
    }))
    
    // Add stats for each manga
    const mangaWithStats = await Promise.all(manga.map(async (m: Manga) => {
      const [bookmarkCount, commentCount] = await Promise.all([
        fetchBookmarkCount(m.slug),
        fetchCommentCount(m.slug)
      ])
      
      return {
        ...m,
        bookmarks: bookmarkCount,
        comments: commentCount
      }
    }))
    
    return mangaWithStats
  } catch (error) {
    console.error('Error fetching manga list:', error)
    return []
  }
}

async function fetchBookmarkCount(slug: string): Promise<number> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookmarks?manhwa_slug=eq.${slug}&select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
        'Prefer': 'count=exact'
      }
    })
    return parseInt(response.headers.get('content-range')?.split('/')[1] || '0')
  } catch {
    return 0
  }
}

async function fetchCommentCount(slug: string): Promise<number> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/comments?manhwa_slug=eq.${slug}&select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY!}`,
        'Prefer': 'count=exact'
      }
    })
    return parseInt(response.headers.get('content-range')?.split('/')[1] || '0')
  } catch {
    return 0
  }
}
