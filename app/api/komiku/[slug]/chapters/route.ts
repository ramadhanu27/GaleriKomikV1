import { NextResponse } from 'next/server'
import { supabase, SUPABASE_BUCKET } from '@/lib/supabase-server'

// Enable edge caching for 2 hours (7200 seconds)
export const revalidate = 7200

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Download chapters from Supabase Storage
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(`Chapter/komiku/${slug}.json`)

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chapters not found',
        },
        { status: 404 }
      )
    }

    const text = await data.text()
    const chapterJson = JSON.parse(text)
    let chapters = chapterJson.chapters || []

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedChapters = chapters.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        chapters: paginatedChapters,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(chapters.length / limit),
          totalItems: chapters.length,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching chapters:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
