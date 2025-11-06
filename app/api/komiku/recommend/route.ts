import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_BUCKET = 'komiku-data'

// Force dynamic rendering (required for request.url usage)
export const dynamic = 'force-dynamic'

// Enable edge caching for 1 hour (3600 seconds)
export const revalidate = 3600

// In-memory cache for metadata (to avoid re-fetching large file)
let cachedMetadata: any[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
    const slug = searchParams.get('slug') || ''
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    let allManhwa: any[] = []
    let recommendations: any[] = []

    // Check cache first
    const now = Date.now()
    if (cachedMetadata && (now - cacheTimestamp) < CACHE_DURATION) {
      allManhwa = cachedMetadata
    } else {
      
      // Ambil file metadata.json dari Supabase
      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl('metadata/metadata.json')

      const response = await fetch(urlData.publicUrl, { 
        next: { revalidate: 3600 },
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(120000) // 120 second timeout
      })
      
      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'metadata.json not found' },
          { status: 404 }
        )
      }

      // Use streaming for large file
      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let chunks = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks += decoder.decode(value, { stream: true })
        }

        allManhwa = JSON.parse(chunks)
        
        // Cache the result
        cachedMetadata = allManhwa
        cacheTimestamp = Date.now()
      } else {
        allManhwa = await response.json()
      }
    }
    if (!Array.isArray(allManhwa) || allManhwa.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No manhwa data found' },
        { status: 404 }
      )
    }

    // --- Jika ada slug → rekomendasi berdasarkan genre & rating ---
    if (slug) {
      const current = allManhwa.find((m: any) => m.slug === slug)
      if (!current) {
        return NextResponse.json(
          { success: false, error: 'Slug not found in metadata' },
          { status: 404 }
        )
      }

      const targetGenres = current.genres?.map((g: string) => g.toLowerCase()) || []
      const targetStatus = current.status?.toLowerCase() || ''
      const targetRating = parseFloat(current.rating) || 0

      recommendations = allManhwa
        .filter((m: any) => m.slug !== slug)
        .map((m: any) => {
          const genres = m.genres?.map((g: string) => g.toLowerCase()) || []
          const rating = parseFloat(m.rating) || 0

          const genreScore = genres.filter((g: string) => targetGenres.includes(g)).length
          const statusScore = m.status?.toLowerCase() === targetStatus ? 1 : 0
          const ratingScore = 1 - Math.abs(targetRating - rating) / 10

          const totalScore = genreScore * 2 + statusScore + ratingScore
          return { ...m, similarity: totalScore }
        })
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit)
    }

    // --- Jika tidak ada slug → tampilkan distribusi merata per type ---
    else {
      // Debug: Check type distribution in raw data
      const typeCount: Record<string, number> = {}
      allManhwa.forEach((m: any) => {
        const type = (m.type || 'undefined').trim()
        typeCount[type] = (typeCount[type] || 0) + 1
      })
      console.log('📊 Type distribution in metadata:', typeCount)
      
      // Group by type and get top rated from each
      const byType: Record<string, any[]> = {
        'Manhwa': [],
        'Manga': [],
        'Manhua': []
      }
      
      allManhwa.forEach((m: any) => {
        const type = (m.type || '').trim()
        if (byType[type]) {
          byType[type].push(m)
        }
      })
      
      // Get items from each type (ensure even distribution)
      const perType = Math.ceil(limit / 3) // ~33 per type for limit=100
      
      Object.keys(byType).forEach(type => {
        // Sort by rating (items with rating first, then by rating value, then items without rating)
        const sorted = byType[type]
          .sort((a: any, b: any) => {
            const ratingA = parseFloat(a.rating)
            const ratingB = parseFloat(b.rating)
            
            // Both have rating: sort by rating value
            if (!isNaN(ratingA) && !isNaN(ratingB)) {
              return ratingB - ratingA
            }
            // Only A has rating: A comes first
            if (!isNaN(ratingA)) return -1
            // Only B has rating: B comes first
            if (!isNaN(ratingB)) return 1
            // Neither has rating: keep original order
            return 0
          })
          .slice(0, perType)
        
        const withRating = sorted.filter((m: any) => !isNaN(parseFloat(m.rating))).length
        recommendations.push(...sorted)
        console.log(`✅ Added ${sorted.length} ${type} items (${withRating} with rating, ${sorted.length - withRating} without rating)`)
      })
      
      // If we still need more items, add remaining by rating
      if (recommendations.length < limit) {
        const remaining = allManhwa
          .filter((m: any) => !recommendations.find((r: any) => r.slug === m.slug))
          .filter((m: any) => !isNaN(parseFloat(m.rating)))
          .sort((a: any, b: any) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
          .slice(0, limit - recommendations.length)
        
        recommendations.push(...remaining)
      }
      
      // Final shuffle to mix types
      recommendations = recommendations.slice(0, limit)
    }

    // --- Format output ---
    const result = recommendations.map((m: any) => {
      // Use lastTwoChapters from metadata if available, otherwise generate from chapters
      let lastTwoChapters = m.lastTwoChapters || []
      
      if (lastTwoChapters.length === 0 && m.chapters && m.chapters.length > 0) {
        lastTwoChapters = m.chapters
          .slice(-2)
          .reverse()
          .map((ch: any) => ({
            title: ch.title,
            url: ch.url,
            date: ch.date,
          }))
      }
      
      // Normalize type to ensure consistency
      let normalizedType = (m.type || 'Manhwa').trim()
      
      // Ensure proper capitalization (case-insensitive comparison)
      const lowerType = normalizedType.toLowerCase()
      if (lowerType === 'manhwa') normalizedType = 'Manhwa'
      else if (lowerType === 'manga') normalizedType = 'Manga'
      else if (lowerType === 'manhua') normalizedType = 'Manhua'
      else {
        // If type is unknown, try to infer or default to Manhwa
        console.warn(`Unknown type "${m.type}" for ${m.slug}, defaulting to Manhwa`)
        normalizedType = 'Manhwa'
      }
      
      return {
        slug: m.slug,
        title: m.manhwaTitle || m.title,
        image: m.image,
        synopsis: m.synopsis || '',
        genres: m.genres || [],
        status: m.status || 'Unknown',
        type: normalizedType,
        rating: m.rating ? parseFloat(m.rating) : null,
        totalChapters: m.totalChapters || m.chapters?.length || 0,
        lastTwoChapters,
        lastModified: m.scrapedAt || m.lastModified || lastTwoChapters[0]?.date || null,
        similarity: m.similarity ?? undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        manhwa: result,
        total: result.length,
      },
    })
  } catch (error) {
    console.error('❌ Error in /api/komiku/recommend:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
