import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Enable edge caching for 5 minutes (300 seconds)
export const revalidate = 300

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const slugs: string[] = body.slugs || []

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Slugs array is required' },
        { status: 400 }
      )
    }

    console.log(`📥 Fetching latest chapters for ${slugs.length} manhwa...`)

    // Fetch chapters for all slugs in parallel
    const results = await Promise.allSettled(
      slugs.map(async (slug) => {
        const possiblePaths = [
          `Chapter/komiku/${slug}.json`,
          `komiku/${slug}.json`,
          `${slug}.json`,
        ]

        for (const path of possiblePaths) {
          try {
            const { data: urlData } = supabase.storage
              .from(SUPABASE_BUCKET)
              .getPublicUrl(path)

            // Add timestamp to bypass CDN cache
            const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`

            const response = await fetch(urlWithTimestamp, {
              cache: 'no-store', // Disable cache for large files (>2MB)
              headers: { 'User-Agent': 'Mozilla/5.0' },
            })

            if (response.ok) {
              const chapterData = await response.json()
              const chapters = chapterData.chapters || []
              
              // Get latest 2 chapters
              const latestChapters = chapters
                .slice(-2)
                .reverse()
                .map((ch: any) => ({
                  number: ch.number,
                  title: ch.title,
                  url: ch.url,
                  date: ch.date,
                }))
              
              // Debug logging for specific manhwa
              if (slug === 'rankers-return-remake') {
                console.log(`🔍 Debug ${slug}:`)
                console.log(`   Total chapters in JSON: ${chapters.length}`)
                console.log(`   ScrapedAt: ${chapterData.scrapedAt}`)
                console.log(`   Last 2 chapters:`, latestChapters)
              }
              
              return {
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
              }
            }
          } catch (err) {
            continue
          }
        }

        // If no file found, return null
        return null
      })
    )

    // Filter successful results
    const data = results
      .filter((result) => result.status === 'fulfilled' && result.value !== null)
      .map((result: any) => result.value)

    // Log failed slugs for debugging
    const failedSlugs = results
      .map((result, index) => ({ result, slug: slugs[index] }))
      .filter(({ result }) => result.status === 'rejected' || result.value === null)
      .map(({ slug }) => slug)
    
    if (failedSlugs.length > 0) {
      console.log(`❌ Failed to fetch ${failedSlugs.length} manhwa:`, failedSlugs.slice(0, 10))
    }

    console.log(`✅ Successfully fetched ${data.length}/${slugs.length} manhwa chapters`)

    return NextResponse.json({
      success: true,
      data: {
        chapters: data,
        total: data.length,
        requested: slugs.length,
      },
    })
  } catch (error) {
    console.error('❌ Error in /api/komiku/batch-latest-chapters:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
