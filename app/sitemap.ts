import { MetadataRoute } from 'next'

const SITE_URL = 'https://www.galerikomik.cyou'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/populer`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/genre`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  try {
    // Fetch manhwa list for dynamic pages
    const response = await fetch(`${SITE_URL}/api/komiku/list-from-files?limit=100`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      return staticPages
    }

    const data = await response.json()
    
    if (!data.success || !data.data?.manhwa) {
      return staticPages
    }

    // Generate manhwa pages
    const manhwaPages = data.data.manhwa.map((manhwa: any) => ({
      url: `${SITE_URL}/manhwa/${manhwa.slug}`,
      lastModified: new Date(manhwa.lastUpdate || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...manhwaPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
