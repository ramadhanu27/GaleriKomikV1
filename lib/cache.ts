/**
 * Client-side cache utility with TTL support
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class ClientCache {
  private cache: Map<string, CacheItem<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    const now = Date.now()
    const isExpired = now - item.timestamp > item.ttl
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean expired items
   */
  cleanExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Singleton instance
export const cache = new ClientCache()

// Clean expired cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanExpired()
  }, 10 * 60 * 1000)
}

/**
 * Fetch with cache
 */
export async function fetchWithCache<T = any>(
  url: string,
  ttl?: number,
  options?: RequestInit
): Promise<T> {
  const cacheKey = `fetch:${url}`
  
  // Try to get from cache first
  const cached = cache.get<T>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from network
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Store in cache
  cache.set(cacheKey, data, ttl)
  
  return data
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCacheByPattern(pattern: string): void {
  const keysToDelete: string[] = []
  
  cache['cache'].forEach((_, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => cache.delete(key))
}
