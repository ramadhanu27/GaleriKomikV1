import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// LRU Cache with TTL
interface CacheEntry {
  base64: string
  contentType: string
  timestamp: number
  size: number
}

class ImageCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number // Max cache size in MB
  private ttl: number // Time to live in ms
  private currentSize: number // Current cache size in bytes

  constructor(maxSizeMB = 100, ttlMinutes = 30) {
    this.cache = new Map()
    this.maxSize = maxSizeMB * 1024 * 1024 // Convert to bytes
    this.ttl = ttlMinutes * 60 * 1000 // Convert to ms
    this.currentSize = 0
  }

  get(url: string): CacheEntry | null {
    const entry = this.cache.get(url)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(url)
      return null
    }
    
    // Move to end (LRU)
    this.cache.delete(url)
    this.cache.set(url, entry)
    
    return entry
  }

  set(url: string, base64: string, contentType: string): void {
    // Calculate size (rough estimate)
    const size = base64.length
    
    // Remove old entry if exists
    if (this.cache.has(url)) {
      this.delete(url)
    }
    
    // Evict old entries if needed (LRU - remove oldest)
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.delete(firstKey)
      } else {
        break
      }
    }
    
    // Add new entry
    this.cache.set(url, {
      base64,
      contentType,
      timestamp: Date.now(),
      size
    })
    
    this.currentSize += size
  }

  delete(url: string): void {
    const entry = this.cache.get(url)
    if (entry) {
      this.currentSize -= entry.size
      this.cache.delete(url)
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      sizeMB: (this.currentSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: (this.maxSize / (1024 * 1024)).toFixed(0),
      hitRate: 0 // Can be tracked separately
    }
  }

  clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }
}

// Global cache instance (persists across requests in same process)
const imageCache = new ImageCache(100, 30) // 100MB, 30 minutes TTL

// Cache stats
let cacheHits = 0
let cacheMisses = 0

// Simple retry helper
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://komiku.org/',
        },
      })

      clearTimeout(timeout)

      // If rate limited, wait and retry
      if (response.status === 429 && i < maxRetries - 1) {
        const waitTime = (i + 1) * 2000 // 2s, 4s, 6s
        console.log(`⚠️ Rate limited, waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      return response
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      
      // Wait before retry
      const waitTime = (i + 1) * 1000 // 1s, 2s, 3s
      console.log(`🔄 Retry ${i + 1}/${maxRetries} after ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  throw new Error('Max retries reached')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing image URL' },
        { status: 400 }
      )
    }

    // Check cache first
    const cached = imageCache.get(imageUrl)
    if (cached) {
      cacheHits++
      const hitRate = ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)
      console.log(`✅ Cache HIT (${hitRate}% hit rate) - ${imageCache.getStats().entries} entries, ${imageCache.getStats().sizeMB}MB`)
      
      return NextResponse.json({
        success: true,
        data: {
          base64: cached.base64,
          contentType: cached.contentType
        },
        cached: true
      })
    }

    // Cache miss - fetch from source
    cacheMisses++
    const hitRate = ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)
    console.log(`❌ Cache MISS (${hitRate}% hit rate) - Fetching from source...`)

    // Fetch the image with retry
    const response = await fetchWithRetry(imageUrl)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      )
    }

    // Get image as buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Convert to base64
    const base64 = buffer.toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const dataUrl = `data:${contentType};base64,${base64}`

    // Store in cache
    imageCache.set(imageUrl, dataUrl, contentType)
    console.log(`💾 Cached image - ${imageCache.getStats().entries} entries, ${imageCache.getStats().sizeMB}MB`)

    return NextResponse.json({
      success: true,
      data: {
        base64: dataUrl,
        contentType
      },
      cached: false
    })

  } catch (error: any) {
    console.error('Error converting image to base64:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}