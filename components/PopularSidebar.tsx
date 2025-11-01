'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Manhwa } from '@/types'

type TimeRange = 'weekly' | 'monthly' | 'all'

export default function PopularSidebar() {
  const [activeTab, setActiveTab] = useState<TimeRange>('weekly')
  const [popularList, setPopularList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPopular()
  }, [activeTab])

  const fetchPopular = async () => {
    setLoading(true)
    try {
      // Ambil data dari metadata.json yang sudah diupload ke Supabase
      const response = await fetch('/api/komiku/recommend?limit=100')
      const data = await response.json()

      if (data.success && Array.isArray(data.data.manhwa)) {
        // Urutkan berdasarkan rating tertinggi
        const sorted = [...data.data.manhwa]
          .filter((m) => m.rating && m.rating > 0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)

        console.log('🔥 Top rated list:', sorted)
        setPopularList(sorted)
      }
    } catch (error) {
      console.error('Error fetching popular (by rating):', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = (rating / 2) % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-yellow-400">⯨</span>)
      } else {
        stars.push(<span key={i} className="text-gray-600 dark:text-gray-500">★</span>)
      }
    }
    return stars
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden sticky top-24 border border-slate-700/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-5">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Popular by Rating
        </h2>
      </div>

      {/* Tabs */}
      <div className="p-4 bg-slate-800/50">
        <div className="flex gap-1.5 bg-slate-700/50 p-1.5 rounded-lg">
          {['weekly', 'monthly', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TimeRange)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-600/50 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Popular List */}
      <div className="divide-y divide-slate-700/50">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-4 animate-pulse">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex-shrink-0" />
              <div className="w-14 h-20 bg-slate-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : (
          popularList.map((manhwa, index) => {
            const getRankColor = (rank: number) => {
              if (rank === 1) return 'from-yellow-500 to-yellow-600'
              if (rank === 2) return 'from-slate-400 to-slate-500'
              if (rank === 3) return 'from-orange-600 to-orange-700'
              return 'from-slate-600 to-slate-700'
            }

            return (
              <Link
                key={manhwa.slug}
                href={`/manhwa/${manhwa.slug}`}
                className="flex gap-3 group hover:bg-slate-700/30 p-4 transition-all"
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center bg-gradient-to-br ${getRankColor(
                    index + 1
                  )} rounded-lg font-bold text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {index + 1}
                </div>

                <div className="w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden ring-2 ring-slate-700 group-hover:ring-primary-500 transition-all shadow-lg">
                  <img
                    src={manhwa.image}
                    alt={manhwa.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-primary-400 transition-colors leading-tight">
                    {manhwa.title?.replace(/^Komik\s+/i, '')}
                  </h3>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {manhwa.genres?.slice(0, 2).map((genre, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {manhwa.rating ? (
                      <>
                        <div className="flex text-xs">{renderStars(manhwa.rating)}</div>
                        <span className="text-xs text-slate-400 font-medium">
                          {(manhwa.rating / 2).toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {manhwa.totalChapters} Ch
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
