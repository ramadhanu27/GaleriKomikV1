import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'
// Enable edge caching for 1 hour (3600 seconds)
export const revalidate = 3600

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

    console.log('📥 Fetching metadata.json from Supabase...')

    // Ambil file metadata.json dari folder metadata
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl('metadata/metadata.json')

    const response = await fetch(urlData.publicUrl, { next: { revalidate: 3600 } })

    if (!response.ok) {
      console.error('❌ metadata.json not found or failed to fetch')
      return NextResponse.json(
        { success: false, error: 'metadata.json not found in Supabase' },
        { status: 404 }
      )
    }

    const allManhwa = await response.json()
    if (!Array.isArray(allManhwa) || allManhwa.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No manhwa data found in metadata.json' },
        { status: 404 }
      )
    }

    console.log(`✅ Loaded ${allManhwa.length} manhwa items`)

    // Urutkan berdasarkan scrapedAt terbaru (desc)
    const sorted = allManhwa
      .filter((m: any) => m.scrapedAt || m.lastModified)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.scrapedAt || a.lastModified || 0).getTime()
        const dateB = new Date(b.scrapedAt || b.lastModified || 0).getTime()
        return dateB - dateA
      })

    // Batasi hasil
    const limited = sorted.slice(0, limit)

    // Format hasil dengan field penting saja
    const result = limited.map((m: any) => ({
      slug: m.slug,
      title: m.manhwaTitle || m.title,
      image: m.image,
      genres: m.genres || [],
      status: m.status || 'Unknown',
      type: m.type || 'Manhwa',
      rating: m.rating ? parseFloat(m.rating) : null,
      totalChapters: m.totalChapters || m.chapters?.length || 0,
      scrapedAt: m.scrapedAt || null,
      lastModified: m.scrapedAt || m.lastModified || null, // Add lastModified for NEW badge
      latestChapters: (m.chapters || [])
        .slice(-3)
        .reverse()
        .map((ch: any) => ({
          number: ch.number,
          title: ch.title,
          url: ch.url,
          date: ch.date,
        })),
    }))

    return NextResponse.json({
      success: true,
      data: {
        manhwa: result,
        total: result.length,
      },
    })
  } catch (error) {
    console.error('❌ Error in /api/komiku/latest:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
