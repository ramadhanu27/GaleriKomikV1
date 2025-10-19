import { NextResponse } from 'next/server'
import { supabase, SUPABASE_BUCKET } from '@/lib/supabase'

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

    return NextResponse.json({
      success: true,
      data: {
        chapter,
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
