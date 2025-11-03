import { Chapter } from '@/types'

export interface LatestChaptersResponse {
  slug: string
  manhwaTitle: string
  alternativeTitle: string | null
  manhwaUrl: string | null
  image: string | null
  author: string | null
  type: string
  status: string
  released: string | null
  genres: string[]
  synopsis: string | null
  totalChapters: number
  scrapedAt: string | null
  latestChapters: Chapter[]
}

/**
 * Fetch latest 2 chapters for a single manhwa
 */
export async function fetchLatestChapters(slug: string): Promise<LatestChaptersResponse | null> {
  try {
    const response = await fetch(`/api/komiku/latest-chapters?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!response.ok) {
      console.error(`Failed to fetch latest chapters for ${slug}`)
      return null
    }

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error(`Error fetching latest chapters for ${slug}:`, error)
    return null
  }
}

/**
 * Fetch latest 2 chapters for multiple manhwa in batch
 */
export async function fetchBatchLatestChapters(slugs: string[]): Promise<LatestChaptersResponse[]> {
  try {
    const response = await fetch('/api/komiku/batch-latest-chapters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slugs }),
      next: { revalidate: 1800 }, // Cache for 30 minutes
    })

    if (!response.ok) {
      console.error('Failed to fetch batch latest chapters')
      return []
    }

    const data = await response.json()
    return data.success ? data.data.chapters : []
  } catch (error) {
    console.error('Error fetching batch latest chapters:', error)
    return []
  }
}

/**
 * Enrich manhwa list with latest chapters data
 */
export async function enrichManhwaWithLatestChapters<T extends { slug: string }>(
  manhwaList: T[]
): Promise<(T & { latestChapters?: Chapter[] })[]> {
  const slugs = manhwaList.map((m) => m.slug)
  const chaptersData = await fetchBatchLatestChapters(slugs)

  // Create a map for quick lookup
  const chaptersMap = new Map(chaptersData.map((c) => [c.slug, c.latestChapters]))

  // Enrich manhwa list with latest chapters
  return manhwaList.map((manhwa) => ({
    ...manhwa,
    latestChapters: chaptersMap.get(manhwa.slug) || [],
  }))
}
