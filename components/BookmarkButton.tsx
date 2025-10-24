'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { addBookmark, removeBookmark, isBookmarked } from '@/lib/bookmark'

interface BookmarkButtonProps {
  manhwaSlug: string
  manhwaTitle: string
  manhwaImage: string
  manhwaType?: string
  onAuthRequired?: () => void
}

export default function BookmarkButton({
  manhwaSlug,
  manhwaTitle,
  manhwaImage,
  manhwaType,
  onAuthRequired,
}: BookmarkButtonProps) {
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkBookmarkStatus()
  }, [user, manhwaSlug])

  const checkBookmarkStatus = async () => {
    if (!user) {
      setBookmarked(false)
      return
    }

    const status = await isBookmarked(user.id, manhwaSlug)
    setBookmarked(status)
  }

  const handleToggleBookmark = async () => {
    if (!user) {
      onAuthRequired?.()
      return
    }

    setLoading(true)

    if (bookmarked) {
      const result = await removeBookmark(user.id, manhwaSlug)
      if (result.success) {
        setBookmarked(false)
      }
    } else {
      const result = await addBookmark(user.id, manhwaSlug, manhwaTitle, manhwaImage, manhwaType)
      if (result.success) {
        setBookmarked(true)
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
        bookmarked
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600/50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={bookmarked ? 'Hapus dari Bookmark' : 'Tambah ke Bookmark'}
    >
      <svg
        className="w-5 h-5"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {bookmarked ? 'Tersimpan' : 'Bookmark'}
    </button>
  )
}
