/**
 * Convert external image URL to use LOCAL Next.js proxy
 * This avoids rate limiting from galerikomik.cyou
 * 
 * Example: https://img.komiku.org/upload5/king-of-drama/95/2025-05-17/2.webp
 * Becomes: /img-proxy/upload5/king-of-drama/95/2025-05-17/2.webp (local proxy)
 * 
 * Also handles: https://thumbnail.komiku.org/img/upload/...
 * Becomes: /thumbnail-proxy/img/upload/... (local proxy)
 * 
 * Next.js rewrites in next.config.js will proxy these to komiku.org directly
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl
  
  try {
    const url = new URL(imageUrl)
    
    // Check if it's from thumbnail.komiku.org
    if (url.hostname === 'thumbnail.komiku.org') {
      // Keep query params for thumbnail (e.g., ?w=500)
      const path = url.pathname + url.search
      return `/thumbnail-proxy${path}`
    }
    
    // Check if it's from img.komiku.org or gambar-id.komiku.org
    if (url.hostname === 'img.komiku.org' || url.hostname === 'gambar-id.komiku.org') {
      const path = url.pathname
      return `/img-proxy${path}`
    }
    
    // If already using galerikomik.cyou, convert back to original
    if (url.hostname === 'www.galerikomik.cyou' || url.hostname === 'galerikomik.cyou') {
      if (url.pathname.startsWith('/img-proxy')) {
        return url.pathname.replace('/img-proxy', '/img-proxy')
      }
      if (url.pathname.startsWith('/thumbnail-proxy')) {
        return url.pathname.replace('/thumbnail-proxy', '/thumbnail-proxy') + url.search
      }
    }
    
    // Return original URL if not from komiku.org
    return imageUrl
  } catch (error) {
    // If URL parsing fails, return original
    return imageUrl
  }
}

/**
 * For production with custom subdomain (img.arkomik.com)
 * You would need to:
 * 1. Set up subdomain img.arkomik.com pointing to your server
 * 2. Configure Nginx/Apache to proxy to img.komiku.org
 * 3. Or use this function to rewrite URLs:
 */
export function getCustomDomainImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl
  
  if (imageUrl.includes('img.komiku.org')) {
    // Replace domain with your custom subdomain
    return imageUrl.replace('img.komiku.org', 'galerikomik.cyou')
  }
  return imageUrl
}
