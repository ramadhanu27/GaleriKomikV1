import { Metadata } from 'next'

const SITE_URL = 'https://www.galerikomik.cyou'
const SITE_NAME = 'Arkomik'
const SITE_DESCRIPTION = 'Platform terbaik untuk membaca manhwa bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari.'

export function generateManhwaMetadata(manhwa: {
  title: string
  slug: string
  image: string
  synopsis?: string
  genres?: string[]
  author?: string
  type?: string
}): Metadata {
  const cleanTitle = manhwa.title.replace(/^Komik\s+/i, '').replace(/\s+Bahasa Indonesia$/i, '').trim()
  const description = manhwa.synopsis 
    ? manhwa.synopsis.slice(0, 160) + '...'
    : `Baca ${cleanTitle} bahasa Indonesia di ${SITE_NAME}. ${manhwa.genres?.slice(0, 3).join(', ') || 'Manhwa'} terbaik dengan update terbaru.`
  
  const imageUrl = manhwa.image.startsWith('http') 
    ? manhwa.image 
    : `${SITE_URL}${manhwa.image}`

  return {
    title: `${cleanTitle} - Baca Manhwa Bahasa Indonesia | ${SITE_NAME}`,
    description,
    keywords: [
      cleanTitle,
      'manhwa',
      'baca online',
      'bahasa indonesia',
      ...(manhwa.genres || []),
      manhwa.author || '',
      manhwa.type || ''
    ].filter(Boolean).join(', '),
    openGraph: {
      title: cleanTitle,
      description,
      url: `${SITE_URL}/manhwa/${manhwa.slug}`,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 1200,
          alt: cleanTitle,
        },
      ],
      locale: 'id_ID',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/manhwa/${manhwa.slug}`,
    },
  }
}

export function generateChapterMetadata(
  manhwaTitle: string,
  chapterNumber: string,
  manhwaSlug: string
): Metadata {
  const cleanTitle = manhwaTitle.replace(/^Komik\s+/i, '').replace(/\s+Bahasa Indonesia$/i, '').trim()
  const title = `${cleanTitle} Chapter ${chapterNumber}`
  const description = `Baca ${cleanTitle} Chapter ${chapterNumber} bahasa Indonesia di ${SITE_NAME}. Update terbaru dengan kualitas gambar HD.`

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: `${cleanTitle}, chapter ${chapterNumber}, manhwa, baca online, bahasa indonesia`,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/manhwa/${manhwaSlug}/chapter/${chapterNumber}`,
      siteName: SITE_NAME,
      locale: 'id_ID',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/manhwa/${manhwaSlug}/chapter/${chapterNumber}`,
    },
  }
}

export function generateStructuredData(manhwa: {
  title: string
  slug: string
  image: string
  synopsis?: string
  genres?: string[]
  author?: string
  rating?: number
  totalChapters?: number
}) {
  const cleanTitle = manhwa.title.replace(/^Komik\s+/i, '').replace(/\s+Bahasa Indonesia$/i, '').trim()
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: cleanTitle,
    url: `${SITE_URL}/manhwa/${manhwa.slug}`,
    image: manhwa.image.startsWith('http') ? manhwa.image : `${SITE_URL}${manhwa.image}`,
    description: manhwa.synopsis || `Baca ${cleanTitle} bahasa Indonesia`,
    author: manhwa.author ? {
      '@type': 'Person',
      name: manhwa.author
    } : undefined,
    genre: manhwa.genres?.join(', '),
    aggregateRating: manhwa.rating ? {
      '@type': 'AggregateRating',
      ratingValue: manhwa.rating,
      bestRating: 10,
      ratingCount: 1
    } : undefined,
    numberOfPages: manhwa.totalChapters,
    inLanguage: 'id',
  }
}

export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`
    }))
  }
}
