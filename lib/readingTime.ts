/**
 * Calculate estimated reading time for a chapter
 * @param imageCount - Number of images in the chapter
 * @param averageTimePerImage - Average time to read one image (in seconds)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(imageCount: number, averageTimePerImage: number = 5): number {
  const totalSeconds = imageCount * averageTimePerImage
  const minutes = Math.ceil(totalSeconds / 60)
  return minutes
}

/**
 * Format reading time to human-readable string
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min", "1 hour 20 min")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`
}

/**
 * Calculate total reading time for all chapters
 * @param chapters - Array of chapters with image counts
 * @returns Total reading time in minutes
 */
export function calculateTotalReadingTime(chapters: { images?: any[] }[]): number {
  let totalMinutes = 0
  
  chapters.forEach(chapter => {
    const imageCount = chapter.images?.length || 0
    totalMinutes += calculateReadingTime(imageCount)
  })
  
  return totalMinutes
}

/**
 * Get reading speed category
 * @param minutes - Reading time in minutes
 * @returns Speed category (Quick, Medium, Long)
 */
export function getReadingSpeedCategory(minutes: number): 'Quick' | 'Medium' | 'Long' {
  if (minutes <= 5) return 'Quick'
  if (minutes <= 15) return 'Medium'
  return 'Long'
}

/**
 * Get reading time badge color
 * @param minutes - Reading time in minutes
 * @returns Tailwind color classes
 */
export function getReadingTimeBadgeColor(minutes: number): string {
  const category = getReadingSpeedCategory(minutes)
  
  switch (category) {
    case 'Quick':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'Medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'Long':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
}
