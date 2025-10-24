/**
 * Get country flag image based on manhwa type
 * @param type - Type of comic (manhwa, manga, manhua, etc.)
 * @returns Path to flag image
 */
export function getFlagByType(type?: string): string {
  if (!type) return '/korea.png' // Default to Korea
  
  const normalizedType = type.toLowerCase().trim()
  
  // Manga = Japan
  if (normalizedType.includes('manga')) {
    return '/japan.png'
  }
  
  // Manhwa = Korea
  if (normalizedType.includes('manhwa')) {
    return '/korea.png'
  }
  
  // Manhua = China
  if (normalizedType.includes('manhua')) {
    return '/china.png'
  }
  
  // Default to Korea
  return '/korea.png'
}

/**
 * Get country name based on type
 */
export function getCountryByType(type?: string): string {
  if (!type) return 'Korea'
  
  const normalizedType = type.toLowerCase().trim()
  
  if (normalizedType.includes('manga')) return 'Japan'
  if (normalizedType.includes('manhwa')) return 'Korea'
  if (normalizedType.includes('manhua')) return 'China'
  
  return 'Korea'
}
