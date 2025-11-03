import { Metadata } from 'next'

const SITE_URL = 'https://www.galerikomik.cyou'
const SITE_NAME = 'Galeri Komik'
const SITE_DESCRIPTION = 'Platform terbaik untuk membaca komik bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari.'

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
    : `Baca ${cleanTitle} bahasa Indonesia di ${SITE_NAME}. ${manhwa.genres?.slice(0, 3).join(', ') || 'Komik'} terbaik dengan update terbaru.`
  
  const imageUrl = manhwa.image.startsWith('http') 
    ? manhwa.image 
    : `${SITE_URL}${manhwa.image}`

  return {
    title: `${cleanTitle} - Baca Komik Bahasa Indonesia | ${SITE_NAME}`,
    description,
    keywords: [
      cleanTitle,
      'komik',
      'manga',
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
    keywords: `${cleanTitle}, chapter ${chapterNumber}, komik, manga, manhwa, baca online, bahasa indonesia`,
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

export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'id'
  }
}

export function generateArticleStructuredData(article: {
  title: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  author: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-new.jpg`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    }
  }
}

export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-new.jpg`,
    description: SITE_DESCRIPTION,
    sameAs: [
      // Add social media links
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'Indonesian'
    }
  }
}

export function generateCollectionPageStructuredData(collection: {
  name: string
  description: string
  url: string
  items: { name: string; url: string; image: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: collection.url,
    hasPart: collection.items.map(item => ({
      '@type': 'CreativeWork',
      name: item.name,
      url: item.url,
      image: item.image
    }))
  }
}
