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

    // Retry logic with increased timeout
    let response
    let lastError
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} to fetch metadata.json...`)
        response = await fetch(urlData.publicUrl, { 
          next: { revalidate: 3600 },
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(60000) // 60 second timeout for large file
        })
        
        if (response.ok) {
          console.log(`✅ Successfully fetched metadata.json on attempt ${attempt}`)
          break // Success, exit retry loop
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        lastError = err
        console.error(`❌ Attempt ${attempt} failed:`, err)
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000 // 2s, 4s, 6s
          console.log(`Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    if (!response || !response.ok) {
      console.error('❌ All attempts failed to fetch metadata.json')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch metadata.json after multiple attempts',
          details: lastError instanceof Error ? lastError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Use streaming for large file (10MB+)
    let allManhwa: any[] = []
    
    try {
      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let chunks = ''

        console.log('📥 Streaming metadata.json...')
        let chunkCount = 0
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          chunkCount++
          chunks += decoder.decode(value, { stream: true })
          
          // Log progress every 10 chunks
          if (chunkCount % 10 === 0) {
            console.log(`📦 Received ${chunkCount} chunks (${Math.round(chunks.length / 1024 / 1024 * 100) / 100} MB)`)
          }
        }

        console.log(`✅ Streaming complete: ${chunkCount} chunks, ${Math.round(chunks.length / 1024 / 1024 * 100) / 100} MB`)

        // Parse complete JSON
        console.log('🔍 Parsing JSON...')
        allManhwa = JSON.parse(chunks)
        console.log(`✅ Parsed ${allManhwa.length} manhwa items`)
      } else {
        // Fallback to regular JSON parsing
        console.log('⚠️ No response.body, using regular JSON parsing...')
        allManhwa = await response.json()
      }
    } catch (parseError) {
      console.error('❌ Failed to parse metadata.json:', parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON format in metadata.json',
          details: parseError instanceof Error ? parseError.message : 'Parse error'
        },
        { status: 500 }
      )
    }

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
