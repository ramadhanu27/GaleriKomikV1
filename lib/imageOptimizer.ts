// Supabase CDN Image Optimizer
const SUPABASE_PROJECT_ID = 'huhhzvaiqskhldhxexcu'
const SUPABASE_BUCKET = 'komiku-data'

interface ImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'origin'
}

/**
 * Optimize image URL using Supabase CDN
 * Automatically resizes, compresses, and converts to modern formats
 */
export function optimizeImage(
  path: string,
  options: ImageOptions = {}
): string {
  // If it's already an external URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const {
    width = 800,
    quality = 80,
    format = 'webp'
  } = options

  // Build CDN URL with transformations
  const baseUrl = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/render/image/public/${SUPABASE_BUCKET}`
  const params = new URLSearchParams()
  
  if (width) params.append('width', width.toString())
  if (quality) params.append('quality', quality.toString())
  if (format !== 'origin') params.append('format', format)

  return `${baseUrl}/${path}?${params.toString()}`
}

/**
 * Get optimized thumbnail URL
 */
export function getThumbnail(path: string): string {
  return optimizeImage(path, {
    width: 400,
    quality: 85,
    format: 'webp'
  })
}

/**
 * Get optimized cover URL
 */
export function getCover(path: string): string {
  return optimizeImage(path, {
    width: 600,
    quality: 85,
    format: 'webp'
  })
}

/**
 * Get optimized chapter image URL
 */
export function getChapterImage(path: string): string {
  return optimizeImage(path, {
    width: 1200,
    quality: 90,
    format: 'webp'
  })
}
