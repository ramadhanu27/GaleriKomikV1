import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Bookmark, ReadingHistory } from '@/types'

interface BookmarkStore {
  bookmarks: Bookmark[]
  readingHistory: ReadingHistory[]
  
  // Bookmark actions
  addBookmark: (manhwa: Bookmark) => void
  removeBookmark: (slug: string) => void
  toggleBookmark: (manhwa: Bookmark) => void
  isBookmarked: (slug: string) => boolean
  getBookmarks: () => Bookmark[]
  
  // History actions
  updateReadingHistory: (history: ReadingHistory) => void
  getReadingHistory: (slug: string) => ReadingHistory | undefined
  getAllHistory: () => ReadingHistory[]
  getHistoryCount: () => number
  getRecentHistory: (limit?: number) => ReadingHistory[]
  clearHistory: () => void
  removeFromHistory: (slug: string) => void
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      readingHistory: [],

      addBookmark: (manhwa) => {
        const { bookmarks } = get()
        if (!bookmarks.some((b) => b.slug === manhwa.slug)) {
          set({
            bookmarks: [...bookmarks, { ...manhwa, addedAt: Date.now() }],
          })
        }
      },

      removeBookmark: (slug) => {
        set({
          bookmarks: get().bookmarks.filter((b) => b.slug !== slug),
        })
      },

      toggleBookmark: (manhwa) => {
        const { isBookmarked, addBookmark, removeBookmark } = get()
        if (isBookmarked(manhwa.slug)) {
          removeBookmark(manhwa.slug)
        } else {
          addBookmark(manhwa)
        }
      },

      isBookmarked: (slug) => {
        return get().bookmarks.some((b) => b.slug === slug)
      },

      getBookmarks: () => {
        return [...get().bookmarks].sort((a, b) => b.addedAt - a.addedAt)
      },

      updateReadingHistory: (history) => {
        const { readingHistory } = get()
        const index = readingHistory.findIndex((h) => h.slug === history.slug)

        if (index !== -1) {
          const updated = [...readingHistory]
          updated[index] = { ...history, lastRead: Date.now() }
          set({ readingHistory: updated })
        } else {
          set({
            readingHistory: [...readingHistory, { ...history, lastRead: Date.now() }],
          })
        }
      },

      getReadingHistory: (slug) => {
        return get().readingHistory.find((h) => h.slug === slug)
      },

      getAllHistory: () => {
        return [...get().readingHistory].sort((a, b) => b.lastRead - a.lastRead)
      },

      getHistoryCount: () => {
        return get().readingHistory.length
      },

      getRecentHistory: (limit = 10) => {
        return [...get().readingHistory]
          .sort((a, b) => b.lastRead - a.lastRead)
          .slice(0, limit)
      },

      clearHistory: () => {
        set({ readingHistory: [] })
      },

      removeFromHistory: (slug) => {
        set({
          readingHistory: get().readingHistory.filter((h) => h.slug !== slug),
        })
      },
    }),
    {
      name: 'arkomik-storage',
    }
  )
)
