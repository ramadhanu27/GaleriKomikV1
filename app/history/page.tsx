'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getReadingHistory, clearReadingHistory, deleteHistoryEntry, ReadingHistory } from '@/lib/readingHistory'
import Link from 'next/link'
import Image from 'next/image'
import { getFlagByType } from '@/lib/getFlagByType'

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState<ReadingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const data = await getReadingHistory(user.id)
    setHistory(data)
    setLoading(false)
  }

  const handleClearHistory = async () => {
    if (!user) return

    const result = await clearReadingHistory(user.id)
    if (result.success) {
      setHistory([])
      setShowClearConfirm(false)
    }
  }

  const handleDeleteEntry = async (historyId: string) => {
    if (!user) return

    const result = await deleteHistoryEntry(user.id, historyId)
    if (result.success) {
      setHistory(history.filter(h => h.id !== historyId))
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays === 1) return '1 hari lalu'
    if (diffDays < 30) return `${diffDays} hari lalu`
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} bulan lalu`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] py-8">
        <div className="container-custom">
          <div className="skeleton h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] py-8">
        <div className="container-custom">
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Login Diperlukan</h2>
            <p className="text-gray-400 mb-6">Silakan login untuk melihat riwayat baca Anda</p>
            <Link href="/" className="btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Riwayat Baca</h1>
              <p className="text-gray-400">
                {history.length} manhwa dibaca
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Semua
            </button>
          )}
        </div>

        {/* History List */}
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-gradient-to-r from-dark-900/50 to-dark-900/30 border border-gray-800 rounded-xl p-4 hover:border-primary-500/50 transition-all group"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <Link
                    href={`/manhwa/${item.manhwa_slug}`}
                    className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={item.manhwa_image}
                      alt={item.manhwa_title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                      sizes="80px"
                    />
                    {/* Flag */}
                    <div className="absolute top-1 left-1">
                      <img
                        src={getFlagByType(item.manhwa_type)}
                        alt="Flag"
                        className="w-5 h-5 shadow-lg"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/manhwa/${item.manhwa_slug}`}
                      className="font-bold text-white text-lg hover:text-primary-400 transition-colors line-clamp-1 mb-1"
                    >
                      {item.manhwa_title.replace(/^Komik\s+/i, '')}
                    </Link>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-400">Terakhir baca:</span>
                      <Link
                        href={`/manhwa/${item.manhwa_slug}/chapter/${item.chapter_id}`}
                        className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Chapter {item.chapter_number}
                      </Link>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getTimeAgo(item.last_read_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/manhwa/${item.manhwa_slug}/chapter/${item.chapter_id}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Lanjut Baca
                    </Link>
                    <button
                      onClick={() => handleDeleteEntry(item.id)}
                      className="px-4 py-2 bg-dark-800/50 hover:bg-red-600/20 text-gray-400 hover:text-red-400 text-sm font-medium rounded-lg transition-all border border-gray-700 hover:border-red-500/50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-dark-900 rounded-xl border border-gray-800">
            <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Belum Ada Riwayat</h2>
            <p className="text-gray-400 mb-6">Mulai baca manhwa untuk melihat riwayat baca Anda</p>
            <Link href="/" className="btn-primary">
              Jelajahi Manhwa
            </Link>
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl shadow-2xl border border-gray-800 p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-2">Hapus Semua Riwayat?</h3>
              <p className="text-gray-400 mb-6">
                Tindakan ini tidak dapat dibatalkan. Semua riwayat baca akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 bg-dark-800 hover:bg-dark-700 text-white font-medium rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
