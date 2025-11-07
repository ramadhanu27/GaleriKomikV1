import { NextResponse } from 'next/server'
import { supabase, SUPABASE_BUCKET } from '@/lib/supabase-server'

// Enable edge caching for 3 hours (10800 seconds)
// Chapter content is static and doesn't change
export const revalidate = 10800

export async function GET(
  request: Request,
  { params }: { params: { slug: string; chapterId: string } }
) {
  try {
    const { slug, chapterId } = params

    // Download chapters from Supabase Storage
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(`Chapter/komiku/${slug}.json`)

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Manhwa not found',
        },
        { status: 404 }
      )
    }

    const text = await data.text()
    const chapterJson = JSON.parse(text)
    const chapters = chapterJson.chapters || []

    // Find the specific chapter
    const chapter = chapters.find((ch: any) => {
      // Support both numeric and string chapter IDs
      const chapterNum = ch.number?.toString() || ch.id?.toString() || ch.chapter?.toString()
      return chapterNum === chapterId || chapterNum === chapterId.toString()
    })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chapter not found',
        },
        { status: 404 }
      )
    }

    // Find previous and next chapters
    const currentIndex = chapters.indexOf(chapter)
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

    // Convert galerikomik.cyou URLs back to img.komiku.org to avoid rate limiting
    const convertToOriginalUrl = (url: string): string => {
      if (!url) return url
      
      // Convert galerikomik.cyou proxy URLs back to img.komiku.org
      if (url.includes('galerikomik.cyou/img-proxy')) {
        return url.replace('https://www.galerikomik.cyou/img-proxy', 'https://img.komiku.org')
      }
      if (url.includes('galerikomik.cyou/thumbnail-proxy')) {
        return url.replace('https://www.galerikomik.cyou/thumbnail-proxy', 'https://thumbnail.komiku.org')
      }
      
      return url
    }

    // Convert all image URLs in chapter
    const convertedChapter = {
      ...chapter,
      images: chapter.images?.map((img: any) => {
        if (typeof img === 'string') {
          return convertToOriginalUrl(img)
        }
        return {
          ...img,
          url: convertToOriginalUrl(img.url || img.src || ''),
          src: convertToOriginalUrl(img.src || img.url || ''),
        }
      }) || [],
    }

    // Add manhwa info to chapter for reading history
    const chapterWithManhwaInfo = {
      ...convertedChapter,
      manhwa_title: chapterJson.title || chapterJson.manhwa_title || slug,
      manhwa_image: chapterJson.image || chapterJson.cover || '',
      manhwa_slug: slug,
    }

    return NextResponse.json({
      success: true,
      data: {
        chapter: chapterWithManhwaInfo,
        navigation: {
          prev: prevChapter ? {
            id: prevChapter.number?.toString() || prevChapter.id || prevChapter.chapter,
            title: prevChapter.title || `Chapter ${prevChapter.number}`,
          } : null,
          next: nextChapter ? {
            id: nextChapter.number?.toString() || nextChapter.id || nextChapter.chapter,
            title: nextChapter.title || `Chapter ${nextChapter.number}`,
          } : null,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching chapter:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
