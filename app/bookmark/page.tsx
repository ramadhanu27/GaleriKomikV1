'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserBookmarks, Bookmark } from '@/lib/bookmark'
import Link from 'next/link'
import Image from 'next/image'
import { getFlagByType } from '@/lib/getFlagByType'

export default function BookmarkPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      fetchBookmarks()
    }
  }, [user, authLoading])

  const fetchBookmarks = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    const data = await getUserBookmarks(user.id)
    setBookmarks(data)
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="skeleton h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Login Diperlukan</h2>
            <p className="text-slate-400 mb-6">Silakan login untuk melihat bookmark Anda</p>
            <Link href="/" className="btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Bookmark Saya</h1>
              <p className="text-slate-400">
                {bookmarks.length} manhwa tersimpan
              </p>
            </div>
          </div>
        </div>

        {/* Bookmarks Grid */}
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bookmarks.map((bookmark) => (
              <Link
                key={bookmark.id}
                href={`/manhwa/${bookmark.manhwa_slug}`}
                className="group cursor-pointer block rounded-lg overflow-hidden bg-slate-800 hover:ring-2 hover:ring-primary-500 shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
                  <Image
                    src={bookmark.manhwa_image}
                    alt={bookmark.manhwa_title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />

                  {/* Flag Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="w-8 h-8 overflow-hidden shadow-lg">
                      <img
                        src={getFlagByType(bookmark.manhwa_type)}
                        alt="Flag"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Bookmark Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
                    <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">
                      {bookmark.manhwa_title.replace(/^Komik\s+/i, '')}
                    </h3>
                  </div>
                </div>

                {/* Date Info */}
                <div className="bg-slate-800 p-2.5">
                  <p className="text-xs text-slate-400">
                    Ditambahkan {new Date(bookmark.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <svg className="w-20 h-20 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Belum Ada Bookmark</h2>
            <p className="text-slate-400 mb-6">Mulai tambahkan manhwa favorit Anda ke bookmark</p>
            <Link href="/" className="btn-primary">
              Jelajahi Manhwa
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
