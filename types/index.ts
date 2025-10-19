export interface Manhwa {
  slug: string
  title: string
  manhwaTitle?: string
  image: string
  imageAlt?: string
  rating?: number
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
  isHot?: boolean
  url?: string
  alternativeTitle?: string
  released?: string
  totalChapters?: number
  lastModified?: string
}

export interface Chapter {
  number: string
  title: string
  url: string
  date?: string
  views?: string
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
