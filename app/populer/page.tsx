'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'

type TimeFilter = 'weekly' | 'monthly' | 'all'

export default function PopulerPage() {
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  useEffect(() => {
    fetchManhwa()
  }, [page, timeFilter])

  const fetchManhwa = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/komiku/list?page=${page}&limit=30&withCovers=true`)
      const data = await response.json()
      
      if (data.success) {
        const sorted = [...data.data.manhwa].sort((a, b) => {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return ratingB - ratingA
        })
        setManhwaList(sorted)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching manhwa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter)
    setPage(1)
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                Manhwa Populer
              </h1>
              <p className="text-slate-300">
                Manhwa paling populer dan paling banyak dibaca
              </p>
            </div>

            {/* Time Filter Tabs */}
            <div className="flex gap-2 bg-slate-700/50 p-1.5 rounded-lg">
              <button
                onClick={() => handleFilterChange('weekly')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  timeFilter === 'weekly'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                    : 'text-slate-300 hover:bg-slate-600/50 hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => handleFilterChange('monthly')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  timeFilter === 'monthly'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                    : 'text-slate-300 hover:bg-slate-600/50 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  timeFilter === 'all'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                    : 'text-slate-300 hover:bg-slate-600/50 hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {manhwaList.map((manhwa) => (
                <ManhwaCard key={manhwa.slug} manhwa={manhwa} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium shadow-lg">
                    {page}
                  </span>
                  <span className="text-slate-400">of</span>
                  <span className="px-4 py-2.5 bg-slate-700/50 text-white rounded-lg font-medium">
                    {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
