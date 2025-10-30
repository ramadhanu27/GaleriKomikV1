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
    const slug = searchParams.get('slug') || ''
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    // Ambil data metadata gabungan
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl('metadata/metadata.json')

    const response = await fetch(urlData.publicUrl, { cache: 'no-store' })
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'metadata.json not found' },
        { status: 404 }
      )
    }

    const allManhwa = await response.json()
    if (!Array.isArray(allManhwa) || allManhwa.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No manhwa data found' },
        { status: 404 }
      )
    }

    let recommendations = []

    if (slug) {
      // Cari komik utama berdasarkan slug
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

      // Hitung skor kemiripan berdasarkan genre, status, dan rating
      recommendations = allManhwa
        .filter((m: any) => m.slug !== slug)
        .map((m: any) => {
          const genres = m.genres?.map((g: string) => g.toLowerCase()) || []
          const rating = parseFloat(m.rating) || 0

          // Genre overlap
          const genreScore = genres.filter((g: string) => targetGenres.includes(g)).length
          // Status cocok
          const statusScore = m.status?.toLowerCase() === targetStatus ? 1 : 0
          // Rating mirip
          const ratingScore = 1 - Math.abs(targetRating - rating) / 10

          const totalScore = genreScore * 2 + statusScore + ratingScore
          return { ...m, similarity: totalScore }
        })
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, limit)
    } else {
      // Kalau tidak ada slug, tampilkan semua manhwa (tanpa filter rating)
      recommendations = allManhwa.slice(0, limit)
    }

    // Format output
    const result = recommendations.map((m: any) => ({
      slug: m.slug,
      title: m.manhwaTitle || m.title,
      image: m.image,
      genres: m.genres,
      status: m.status,
      type: m.type,
      rating: m.rating,
      totalChapters: m.totalChapters || m.chapters?.length || 0,
      similarity: m.similarity || undefined
    }))

    return NextResponse.json({
      success: true,
      data: {
        manhwa: result,
        total: result.length
      }
    })
  } catch (error) {
    console.error('Error in /api/komiku/recommend:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
