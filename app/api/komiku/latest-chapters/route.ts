import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Enable edge caching for 30 minutes (1800 seconds)
export const revalidate = 1800

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
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    console.log(`📥 Fetching latest chapters for: ${slug}`)

    // Try multiple possible paths for the chapter file
    const possiblePaths = [
      `Chapter/komiku/${slug}.json`,
      `komiku/${slug}.json`,
      `${slug}.json`,
    ]

    let chapterData = null
    let foundPath = null

    for (const path of possiblePaths) {
      try {
        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(path)

        const response = await fetch(urlData.publicUrl, {
          next: { revalidate: 1800 },
          headers: { 'User-Agent': 'Mozilla/5.0' },
        })

        if (response.ok) {
          chapterData = await response.json()
          foundPath = path
          console.log(`✅ Found chapter file at: ${path}`)
          break
        }
      } catch (err) {
        console.log(`❌ Failed to fetch from: ${path}`)
        continue
      }
    }

    if (!chapterData || !foundPath) {
      return NextResponse.json(
        { success: false, error: 'Chapter file not found' },
        { status: 404 }
      )
    }

    // Extract latest 2 chapters
    const chapters = chapterData.chapters || []
    const latestChapters = chapters
      .slice(-2)
      .reverse()
      .map((ch: any) => ({
        number: ch.number,
        title: ch.title,
        url: ch.url,
        date: ch.date,
      }))

    return NextResponse.json({
      success: true,
      data: {
        slug: chapterData.slug || slug,
        manhwaTitle: chapterData.manhwaTitle || chapterData.title,
        alternativeTitle: chapterData.alternativeTitle || null,
        manhwaUrl: chapterData.manhwaUrl || null,
        image: chapterData.image || null,
        author: chapterData.author || null,
        type: chapterData.type || 'Manhwa',
        status: chapterData.status || 'Unknown',
        released: chapterData.released || null,
        genres: chapterData.genres || [],
        synopsis: chapterData.synopsis || null,
        totalChapters: chapterData.totalChapters || chapters.length,
        scrapedAt: chapterData.scrapedAt || null,
        latestChapters,
      },
    })
  } catch (error) {
    console.error('❌ Error in /api/komiku/latest-chapters:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
