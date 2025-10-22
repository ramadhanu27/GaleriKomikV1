/**
 * Convert external image URL to use local proxy
 * Example: https://img.komiku.org/upload5/king-of-drama/95/2025-05-17/2.webp
 * Becomes: /img-proxy/upload5/king-of-drama/95/2025-05-17/2.webp
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return imageUrl
  
  // Check if it's from img.komiku.org
  if (imageUrl.includes('img.komiku.org')) {
    // Extract the path after img.komiku.org
    const url = new URL(imageUrl)
    const path = url.pathname // e.g., /upload5/king-of-drama/95/2025-05-17/2.webp
    
    // Return proxied URL
    return `/img-proxy${path}`
  }
  
  // Return original URL if not from img.komiku.org
  return imageUrl
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
