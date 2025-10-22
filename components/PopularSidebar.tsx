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
      const response = await fetch('/api/komiku/list-from-files?limit=100')
      const data = await response.json()
      
      console.log('Popular sidebar data:', data)
      
      if (data.success) {
        // Sort by totalChapters (most chapters = most popular) and get top 10
        const sorted = [...data.data.manhwa]
          .filter(m => m.totalChapters && m.totalChapters > 0)
          .sort((a, b) => (b.totalChapters || 0) - (a.totalChapters || 0))
          .slice(0, 10)
        
        console.log('Popular list:', sorted)
        setPopularList(sorted)
      }
    } catch (error) {
      console.error('Error fetching popular:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2) // Convert 10-point to 5-star
    const hasHalfStar = (rating / 2) % 1 >= 0.5
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">★</span>
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">⯨</span>
        )
      } else {
        stars.push(
          <span key={i} className="text-gray-600 dark:text-gray-500">★</span>
        )
      }
    }
    
    return stars
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg overflow-hidden sticky top-24">
      <div className="p-6 pb-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Popular
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'weekly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600'
          }`}
        >
          All
        </button>
      </div>

      </div>

      {/* Popular List */}
      <div className="divide-y divide-gray-200 dark:divide-dark-700">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-300 dark:bg-dark-700 rounded flex-shrink-0" />
              <div className="w-16 h-20 bg-gray-300 dark:bg-dark-700 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-dark-700 rounded w-3/4" />
                <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded w-1/2" />
                <div className="h-3 bg-gray-300 dark:bg-dark-700 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : (
          popularList.map((manhwa, index) => (
            <Link
              key={manhwa.slug}
              href={`/manhwa/${manhwa.slug}`}
              className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-dark-700 p-4 transition-colors"
            >
              {/* Rank Number */}
              <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-dark-700 rounded font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                {index + 1}
              </div>

              {/* Cover Image */}
              <div className="w-16 h-20 flex-shrink-0 rounded overflow-hidden">
                <img
                  src={manhwa.image}
                  alt={manhwa.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {manhwa.title.replace(/^Komik\s+/i, '')}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  Genres: {manhwa.genres?.slice(0, 2).join(', ') || 'N/A'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {manhwa.rating ? (
                    <>
                      <div className="flex text-sm">
                        {renderStars(manhwa.rating)}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {(manhwa.rating / 2).toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {manhwa.totalChapters} Chapters
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
