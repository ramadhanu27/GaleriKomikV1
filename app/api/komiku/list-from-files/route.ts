import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    console.log('Loading combined metadata.json from Supabase...')

    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl('metadata/metadata.json')

    const response = await fetch(urlData.publicUrl, { cache: 'no-store' })

    if (!response.ok) {
      console.error('Failed to fetch metadata.json')
      return NextResponse.json(
        { success: false, error: 'metadata.json not found in Supabase' },
        { status: 404 }
      )
    }

    const allManhwa = await response.json()
    console.log(`Loaded ${allManhwa.length} manhwa from metadata.json`)

    // Sort by scrapedAt (newest first)
    const sorted = allManhwa.sort((a: any, b: any) => {
      const dateA = new Date(a.scrapedAt || a.lastModified || 0).getTime()
      const dateB = new Date(b.scrapedAt || b.lastModified || 0).getTime()
      return dateB - dateA
    })

    // Apply limit
    const limited = sorted.slice(0, limit)

    // Optional: select preview fields only
    const result = limited.map((m: any) => ({
      slug: m.slug,
      title: m.manhwaTitle || m.title,
      image: m.image,
      genres: m.genres,
      status: m.status,
      type: m.type,
      rating: m.rating,
      totalChapters: m.totalChapters || m.chapters?.length || 0,
      scrapedAt: m.scrapedAt,
      chapters: m.chapters?.slice(0, 3) || [],
    }))

    return NextResponse.json({
      success: true,
      data: {
        manhwa: result,
        total: result.length,
      },
    })
  } catch (error) {
    console.error('Error in /api/komiku/list:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
