import { NextResponse } from 'next/server'
import { supabase, SUPABASE_BUCKET } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Download komiku-list.json from Supabase Storage
    const { data: listData, error: listError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download('komiku-list.json')

    if (listError) {
      throw new Error(`Failed to fetch list: ${listError.message}`)
    }

    const listText = await listData.text()
    const manhwaList = JSON.parse(listText)

    const manhwa = manhwaList.find((m: any) => m.slug === slug)

    if (!manhwa) {
      return NextResponse.json(
        {
          success: false,
          error: 'Manhwa not found',
        },
        { status: 404 }
      )
    }

    // Try to download chapters from Supabase Storage
    let chapters = []
    let chapterInfo = {}
    
    // Try multiple possible file names
    const possiblePaths = [
      `Chapter/komiku/${manhwa.jsonFileName || slug}.json`, // Try jsonFileName first
      `komiku/${manhwa.jsonFileName || slug}.json`, // Try without Chapter folder
      `${manhwa.jsonFileName || slug}.json`, // Try root
    ]
    
    let chapterData = null
    let chapterError = null
    
    for (const path of possiblePaths) {
      const result = await supabase.storage
        .from(SUPABASE_BUCKET)
        .download(path)
      
      if (!result.error && result.data) {
        console.log(`Found chapter file at: ${path}`)
        chapterData = result.data
        chapterError = null
        break
      } else {
        chapterError = result.error
      }
    }
    
    if (!chapterError && chapterData) {
      const chapterText = await chapterData.text()
      const chapterJson = JSON.parse(chapterText)
      
      console.log('Chapter JSON image:', chapterJson.image)
      console.log('Manhwa list image:', manhwa.image)
      
      // Extract chapters array from the JSON structure
      chapters = chapterJson.chapters || []
      
      // Also include other metadata if available
      chapterInfo = {
        manhwaTitle: chapterJson.manhwaTitle,
        alternativeTitle: chapterJson.alternativeTitle,
        synopsis: chapterJson.synopsis,
        totalChapters: chapterJson.totalChapters,
        status: chapterJson.status,
        released: chapterJson.released,
        author: chapterJson.author,
        artist: chapterJson.artist,
        type: chapterJson.type,
        genres: chapterJson.genres,
        image: chapterJson.image, // Use image from chapter JSON
        manhwaUrl: chapterJson.manhwaUrl,
        slug: chapterJson.slug,
      }
    } else {
      console.log('Chapter error - tried all paths:', chapterError?.message)
    }

    const finalData = {
      ...manhwa,
      ...chapterInfo, // This will override manhwa fields with chapter JSON data
      chapters,
      totalChapters: (chapterInfo as any).totalChapters || chapters.length,
    }
    
    console.log('Final image URL:', finalData.image)

    return NextResponse.json({
      success: true,
      data: finalData,
    })
  } catch (error: any) {
    console.error('Error fetching manhwa detail:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
