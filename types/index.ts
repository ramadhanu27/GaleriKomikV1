export interface Manhwa {
  slug: string
  title: string
  manhwaTitle?: string
  image: string
  imageAlt?: string
  rating?: number | null
  status?: string
  type?: string
  author?: string
  artist?: string
  serialization?: string
  postedBy?: string
  postedOn?: string
  updatedOn?: string
  genres?: string[]
  synopsis?: string
  chapters?: Chapter[]
  latestChapters?: Chapter[]
  isHot?: boolean
  url?: string
  alternativeTitle?: string
  released?: string
  totalChapters?: number
  lastModified?: string
  scrapedAt?: string
  latestChapterDate?: string | null
  latestChapterTimestamp?: number
}

export interface Chapter {
  number: string
  title: string
  url: string
  date?: string
  views?: string
  images?: Array<{
    page: number
    url: string
    filename: string
  }>
}

export interface ReadingHistory {
  slug: string
  title: string
  image: string
  chapterNumber: string
  chapterTitle?: string
  lastRead: number
  progress: number
  totalChapters?: number
}

export interface Bookmark {
  slug: string
  title: string
  image: string
  latestChapter: string
  addedAt: number
}
