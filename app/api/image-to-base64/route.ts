import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ===== In-memory cache =====
const imageCache = new Map<string, { data: string; type: string; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_ENTRIES = 300

// ===== Rate limiting per IP =====
const rateMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 req per minute per IP

// ===== Helper functions =====
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateMap.get(ip)

  if (!record || now > record.resetTime) {
    rateMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) return false
  record.count++
  return true
}

async function fetchWithBackoff(url: string, retries = 3): Promise<{ buffer: Buffer; contentType: string }> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://komiku.org/',
          'Cache-Control': 'no-cache',
          'Accept': 'image/*,*/*;q=0.8',
        },
      })

      clearTimeout(timeout)

      if (res.status === 429) {
        console.warn(`⚠️ Source rate limited on try ${i + 1}`)
        await sleep(1500 * (i + 1))
        continue
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const buffer = Buffer.from(await res.arrayBuffer())
      return { buffer, contentType: res.headers.get('content-type') || 'image/jpeg' }
    } catch (err) {
      if (i === retries - 1) throw err
      const wait = 1000 * (i + 1)
      console.log(`Retry ${i + 1}/${retries} after ${wait}ms`)
      await sleep(wait)
    }
  }
  throw new Error('Failed after max retries')
}

// ===== API Route =====
export async function GET(req: NextRequest) {
  const start = Date.now()
  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json({ success: false, error: 'Missing image URL' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded, try again later' },
      { status: 429 }
    )
  }

  // ✅ Cache check
  const cached = imageCache.get(imageUrl)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit (${(Date.now() - start)}ms)`)
    return NextResponse.json({
      success: true,
      data: { base64: cached.data, contentType: cached.type, cached: true },
    })
  }

  // Delay sedikit biar gak paralel semua (anti-429)
  await sleep(Math.random() * 300 + 200)

  try {
    const { buffer, contentType } = await fetchWithBackoff(imageUrl)
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`

    // Simpan cache
    imageCache.set(imageUrl, { data: base64, type: contentType, timestamp: Date.now() })
    if (imageCache.size > MAX_CACHE_ENTRIES) {
      const oldest = Array.from(imageCache.keys())[0]
      imageCache.delete(oldest)
    }

    console.log(`✅ Converted ${imageUrl.slice(0, 80)}... in ${Date.now() - start}ms`)

    return NextResponse.json({
      success: true,
      data: { base64, contentType, cached: false },
    }, {
      headers: { 'Cache-Control': 'public, max-age=600' },
    })
  } catch (err: any) {
    console.error(`❌ Image fetch failed:`, err?.message || err)
    const msg = err?.message?.includes('429')
      ? 'Rate limited by source, please retry later'
      : 'Failed to fetch image'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
